import os
import secrets
import sys
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

ENV_PATH = BASE_DIR.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

TESTING = "test" in sys.argv or "pytest" in sys.modules

DEBUG = os.getenv("DEBUG", "False").strip().lower() in ("true", "1", "yes")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY") or secrets.token_urlsafe(50)

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "testserver",
    ".onrender.com",
]
render_hostname = (os.getenv("RENDER_EXTERNAL_HOSTNAME") or "").strip()
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)

extra_hosts = [h.strip() for h in (os.getenv("ALLOWED_HOSTS") or "").split(",") if h.strip()]
for host in extra_hosts:
    if host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "wsapi",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "task_force_bruno.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "task_force_bruno.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR}/db.sqlite3",
        conn_max_age=600,
        ssl_require=bool(os.getenv("DATABASE_URL")),
    )
}

# CORS configuration: explicit allowlist + scoped Vercel preview regex
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://taskforcebruno.vercel.app",
]

frontend_url = (os.getenv("FRONTEND_VERCEL_URL") or "").strip().rstrip("/")
if frontend_url and frontend_url not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(frontend_url)

for origin in (os.getenv("EXTRA_CORS_ORIGINS") or "").split(","):
    clean_origin = origin.strip().rstrip("/")
    if clean_origin and clean_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(clean_origin)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://taskforcebruno(?:-[a-z0-9-]+)?\.vercel\.app$",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)

# Supabase configuration
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip()
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or "").strip()
SUPABASE_ANON_KEY = (os.getenv("SUPABASE_ANON_KEY") or SUPABASE_KEY).strip()
SUPABASE_JWT_SECRET = (os.getenv("SUPABASE_JWT_SECRET") or "").strip()

# Optional exact allowlist of institutional MDC staff emails if a legacy profile lacks a role field
MDC_STAFF_EMAILS = {
    email.strip().lower()
    for email in (os.getenv("MDC_STAFF_EMAILS") or "mdc.staff@cit.edu,mdc.operations@cit.edu,mdc.nurse@cit.edu").split(",")
    if email.strip()
}

# Request upload size limits (6 MB max payload; individual images validated at 5 MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024

# Production security hardening
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

if not DEBUG and not TESTING:
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").strip().lower() in ("true", "1", "yes")
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Django REST Framework configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "wsapi.authentication.SupabaseJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": (
        ["rest_framework.renderers.JSONRenderer", "rest_framework.renderers.BrowsableAPIRenderer"]
        if DEBUG
        else ["rest_framework.renderers.JSONRenderer"]
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        []
        if TESTING
        else [
            "rest_framework.throttling.AnonRateThrottle",
            "rest_framework.throttling.UserRateThrottle",
            "rest_framework.throttling.ScopedRateThrottle",
        ]
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/minute",
        "user": "300/minute",
        "auth": "15/minute",
        "search": "60/minute",
    },
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
