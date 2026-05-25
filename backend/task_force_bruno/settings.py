import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ENVIRONMENT ENVIRONMENT PATH CONFIGURATION:
# Ensures Django accurately reads one folder level up to grab your local .env file.
ENV_PATH = BASE_DIR.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

# SECURITY: Secret hashing token pulled safely from environment variable gates
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-task-force-bruno-local-development-node-hash-key")

# SECURITY: Disables debugging logs automatically when running live on the cloud
DEBUG = os.getenv("DEBUG", "False") == "True"

# SYSTEM ROUTING NETWORK GATEWAYS:
ALLOWED_HOSTS = ["localhost", "127.0.0.1", ".onrender.com"]
if os.getenv("RENDER_EXTERNAL_HOSTNAME"):
    ALLOWED_HOSTS.append(os.getenv("RENDER_EXTERNAL_HOSTNAME"))

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',  
    'django.contrib.sessions',      
    'django.contrib.messages',      
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'wsapi',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',  
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  
    'django.contrib.messages.middleware.MessageMiddleware',    
    'django.middleware.clickjacking.XFrameOptionsMiddleware',   
]

ROOT_URLCONF = 'task_force_bruno.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'task_force_bruno.wsgi.application'

# DYNAMIC PRODUCTION DATABASE SWAP:
# Uses dj-database-url to automatically connect to your live Supabase Postgres tables
# over IPv4 when running on Render, while gracefully falling back to SQLite for local work.
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR}/db.sqlite3',
        conn_max_age=600,
        ssl_require=True if os.getenv("DATABASE_URL") else False
    )
}

# CROSS-ORIGIN SHIELD RULES (CORS):
# Authorizes your frontend web endpoints to securely request data from this backend API
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
FRONTEND_URL = os.getenv("FRONTEND_VERCEL_URL")
if FRONTEND_URL:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)
else:
    # Allows collaborative preview links to test data streaming hooks seamlessly
    CORS_ALLOW_ALL_ORIGINS = True

# Supabase Storage & Profile Client Credentials Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# Static assets directories path mapping
STATIC_URL = 'static/'

# Primary keys field auto-increment tracking type mapping
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'