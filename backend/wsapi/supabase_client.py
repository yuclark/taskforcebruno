import logging
import threading
from django.conf import settings
from supabase import Client, create_client

logger = logging.getLogger(__name__)

_PLACEHOLDER_URL = "https://placeholder.supabase.co"
_PLACEHOLDER_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M"

_db_client = None
_db_lock = threading.Lock()


def get_db_client() -> Client:
    """
    Return the shared service client used strictly for database queries and storage uploads.
    Never invoke user sign_in or sign_up methods on this instance, as GoTrue mutates
    client authorization headers when an auth session is established.
    """
    global _db_client
    if _db_client is None:
        with _db_lock:
            if _db_client is None:
                url = settings.SUPABASE_URL or _PLACEHOLDER_URL
                key = settings.SUPABASE_KEY or _PLACEHOLDER_KEY
                if url == _PLACEHOLDER_URL:
                    logger.warning("SUPABASE_URL is not configured; using placeholder client.")
                _db_client = create_client(url, key)
    return _db_client


def create_auth_client() -> Client:
    """
    Create an isolated ephemeral Supabase client for authentication operations
    (sign_in, sign_up, get_user) so user sessions never leak across requests or
    overwrite the service database client's authorization header.
    """
    url = settings.SUPABASE_URL or _PLACEHOLDER_URL
    key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_KEY or _PLACEHOLDER_KEY
    return create_client(url, key)
