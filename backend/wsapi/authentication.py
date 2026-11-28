import hashlib
import logging
import threading
import time
from dataclasses import dataclass
from typing import Optional

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from .supabase_client import create_auth_client, get_db_client

logger = logging.getLogger(__name__)

STAFF_ROLES = frozenset({
    "staff",
    "mdc",
    "mdc_staff",
    "admin",
    "clinician",
    "nurse",
    "veterinarian",
})

NON_STAFF_ROLES = frozenset({"student", "user", "faculty", "community"})

_TOKEN_CACHE_TTL_SECONDS = 30
_TOKEN_CACHE_MAX_SIZE = 512
_token_cache: dict[str, tuple[float, "AuthenticatedUser"]] = {}
_cache_lock = threading.Lock()


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str
    role: str
    is_staff: bool
    first_name: str = ""
    last_name: str = ""
    custom_id: str = ""
    contact_number: str = ""
    department: str = ""
    bio: str = ""
    avatar_url: str = ""

    @property
    def pk(self) -> str:
        # Required by DRF's UserRateThrottle (uses request.user.pk as the cache identity)
        return self.id

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def to_profile_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "is_staff": self.is_staff,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "custom_id": self.custom_id,
            "student_id": self.custom_id,
            "contact_number": self.contact_number,
            "department": self.department,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
        }


def resolve_is_staff(role: str, email: str) -> bool:
    role_clean = (role or "").strip().lower()
    email_clean = (email or "").strip().lower()

    if role_clean in STAFF_ROLES:
        return True
    if role_clean in NON_STAFF_ROLES or "student" in role_clean:
        return False

    # Only if no explicit role exists at all, allow exact configured staff emails
    if not role_clean and email_clean and email_clean in settings.MDC_STAFF_EMAILS:
        return True

    return False


def invalidate_cached_token(token: str) -> None:
    if not token:
        return
    key = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with _cache_lock:
        _token_cache.pop(key, None)


def clear_token_cache() -> None:
    with _cache_lock:
        _token_cache.clear()


def _get_cached_user(token_hash: str) -> Optional[AuthenticatedUser]:
    now = time.monotonic()
    with _cache_lock:
        entry = _token_cache.get(token_hash)
        if not entry:
            return None
        expires_at, user = entry
        if now >= expires_at:
            _token_cache.pop(token_hash, None)
            return None
        return user


def _set_cached_user(token_hash: str, user: AuthenticatedUser, ttl_seconds: float) -> None:
    if ttl_seconds <= 0:
        return
    with _cache_lock:
        if len(_token_cache) >= _TOKEN_CACHE_MAX_SIZE:
            now = time.monotonic()
            expired = [k for k, (exp, _) in _token_cache.items() if now >= exp]
            for k in expired:
                _token_cache.pop(k, None)
            if len(_token_cache) >= _TOKEN_CACHE_MAX_SIZE:
                _token_cache.clear()
        _token_cache[token_hash] = (time.monotonic() + ttl_seconds, user)


def _load_profile_row(user_id: str) -> dict:
    if not user_id:
        return {}
    try:
        res = get_db_client().table("profiles").select("*").eq("id", user_id).execute()
        if res.data:
            return res.data[0] or {}
    except Exception as exc:
        logger.warning("Profile lookup failed for user %s: %s", user_id, exc)
    return {}


def _build_authenticated_user(
    user_id: str,
    email: str,
    app_metadata: dict,
    user_metadata: dict,
) -> AuthenticatedUser:
    profile = _load_profile_row(user_id)

    # Strictly trust server-managed authorization sources only (profiles table -> app_metadata).
    # Never fall back to user_metadata for role/authorization because users can edit user_metadata.
    role = (
        str(profile.get("role") or "").strip().lower()
        or str((app_metadata or {}).get("role") or "").strip().lower()
    )
    if role == "authenticated":
        role = ""

    resolved_email = (email or profile.get("email") or (user_metadata or {}).get("email") or "").strip().lower()
    first_name = (profile.get("first_name") or (user_metadata or {}).get("first_name") or "").strip()
    last_name = (profile.get("last_name") or (user_metadata or {}).get("last_name") or "").strip()
    custom_id = (
        profile.get("custom_id")
        or (user_metadata or {}).get("custom_id")
        or (user_metadata or {}).get("user_id")
        or ""
    ).strip()
    contact_number = str(profile.get("contact_number") or "").strip()
    department = str(profile.get("department") or "").strip()
    bio = str(profile.get("bio") or "").strip()
    avatar_url = str(profile.get("avatar_url") or "").strip()

    is_staff = resolve_is_staff(role, resolved_email)
    canonical_role = role or ("staff" if is_staff else "user")

    return AuthenticatedUser(
        id=str(user_id or ""),
        email=resolved_email,
        role=canonical_role,
        is_staff=is_staff,
        first_name=first_name,
        last_name=last_name,
        custom_id=custom_id,
        contact_number=contact_number,
        department=department,
        bio=bio,
        avatar_url=avatar_url,
    )


def verify_bearer_token(token: str) -> AuthenticatedUser:
    """
    Cryptographically verify a Supabase Bearer JWT via SUPABASE_JWT_SECRET (when configured)
    or via Supabase GoTrue's /auth/v1/user verification endpoint.
    Never trusts unsigned or unverified JWT payloads.
    """
    if not token or token.count(".") != 2:
        raise exceptions.AuthenticationFailed("Invalid authentication token.")

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    cached = _get_cached_user(token_hash)
    if cached is not None:
        return cached

    jwt_secret = settings.SUPABASE_JWT_SECRET
    if jwt_secret:
        try:
            decoded = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False, "require": ["sub", "exp"]},
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Your session has expired. Please sign in again.")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid authentication token.")

        user = _build_authenticated_user(
            user_id=decoded.get("sub", ""),
            email=decoded.get("email", ""),
            app_metadata=decoded.get("app_metadata") or {},
            user_metadata=decoded.get("user_metadata") or {},
        )
        exp_ts = decoded.get("exp")
        remaining = (float(exp_ts) - time.time()) if exp_ts else _TOKEN_CACHE_TTL_SECONDS
        _set_cached_user(token_hash, user, min(_TOKEN_CACHE_TTL_SECONDS, max(0.0, remaining)))
        return user

    # Verify token remotely with Supabase GoTrue (validates signature, exp, and active user)
    try:
        auth_client = create_auth_client()
        user_resp = auth_client.auth.get_user(jwt=token)
    except Exception as exc:
        logger.info("Bearer token verification failed: %s", exc)
        raise exceptions.AuthenticationFailed("Invalid or expired authentication token.")

    supa_user = getattr(user_resp, "user", None)
    if not supa_user or not getattr(supa_user, "id", None):
        raise exceptions.AuthenticationFailed("Invalid or expired authentication token.")

    user = _build_authenticated_user(
        user_id=str(supa_user.id),
        email=str(getattr(supa_user, "email", "") or ""),
        app_metadata=getattr(supa_user, "app_metadata", None) or {},
        user_metadata=getattr(supa_user, "user_metadata", None) or {},
    )

    ttl = _TOKEN_CACHE_TTL_SECONDS
    try:
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        if unverified_claims.get("exp"):
            ttl = min(ttl, max(0.0, float(unverified_claims["exp"]) - time.time()))
    except Exception:
        pass

    _set_cached_user(token_hash, user, ttl)
    return user


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header:
            return None

        parts = auth_header.split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Invalid authorization header format.")

        token = parts[1].strip()
        if not token:
            raise exceptions.AuthenticationFailed("Authentication token is missing.")

        user = verify_bearer_token(token)
        return (user, token)

    def authenticate_header(self, request):
        return self.keyword
