import os
import re
from datetime import datetime
from urllib.parse import urlparse

ID_PATTERN = re.compile(r"^\d{2}-\d{4}-\d{3}$")
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@cit\.edu$")
PHONE_PATTERN = re.compile(r"^(09\d{9}|\+639\d{9}|\d{7,12})$")

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_EXTENSIONS = frozenset({"jpg", "jpeg", "png", "webp", "gif"})
ALLOWED_IMAGE_MIME_TYPES = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
})

EXTENSION_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
}

DATE_FORMATS = (
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S.%fZ",
    "%Y-%m-%dT%H:%M",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d %I:%M %p",
    "%Y-%m-%d",
)


def parse_datetime_safe(raw_val):
    if not raw_val:
        return None
    val = str(raw_val).strip()
    if not val:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    try:
        return datetime.strptime(val.split("T")[0].split(" ")[0], "%Y-%m-%d")
    except ValueError:
        return None


def normalize_date_str(raw_val):
    if raw_val is None:
        return None
    val = str(raw_val).strip()
    if not val:
        return None
    parsed = parse_datetime_safe(val)
    return parsed.strftime("%Y-%m-%d") if parsed else None


def detect_image_format_from_bytes(header: bytes) -> str | None:
    if len(header) < 12:
        return None
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if header.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "webp"
    return None


def validate_image_upload(uploaded_file) -> tuple[bytes, str, str]:
    """
    Validate an uploaded image file against size, extension, MIME type,
    and binary magic bytes. Returns (file_bytes, safe_extension, content_type)
    or raises ValueError with a user-facing validation error.
    """
    if uploaded_file is None:
        raise ValueError("No image file provided.")

    size = getattr(uploaded_file, "size", None)
    if size is not None and size > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("Image file must be 5 MB or smaller.")

    filename = getattr(uploaded_file, "name", "") or ""
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Unsupported image format. Please upload a JPG, PNG, WebP, or GIF image.")

    content_type = (getattr(uploaded_file, "content_type", "") or "").lower().split(";")[0].strip()
    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValueError("Unsupported file type. Please upload a valid image file.")

    file_bytes = uploaded_file.read()
    if not file_bytes:
        raise ValueError("Uploaded image file is empty.")
    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("Image file must be 5 MB or smaller.")

    detected_ext = detect_image_format_from_bytes(file_bytes[:16])
    if not detected_ext:
        raise ValueError("Invalid or corrupted image file. Only genuine JPG, PNG, WebP, and GIF images are allowed.")

    safe_ext = "jpg" if detected_ext == "jpg" else detected_ext
    safe_mime = EXTENSION_TO_MIME[safe_ext]
    return file_bytes, safe_ext, safe_mime


def validate_http_url(raw_url: str | None) -> str | None:
    if raw_url is None:
        return None
    cleaned = str(raw_url).strip()
    if not cleaned:
        return None
    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("Image URL must be a valid http:// or https:// address.")
    if len(cleaned) > 2048:
        raise ValueError("Image URL is too long.")
    return cleaned


def clean_text(raw_val, max_length: int = 2000) -> str:
    if raw_val is None:
        return ""
    text = str(raw_val).strip()
    if len(text) > max_length:
        return text[:max_length]
    return text
