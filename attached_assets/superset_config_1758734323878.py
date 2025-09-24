# Allow your Next.js app to frame Superset (dev)
TALISMAN_ENABLED = False
TALISMAN_CONFIG = {
    # Drop X-Frame-Options (modern browsers use CSP frame-ancestors)
    "frame_options": None,
    "content_security_policy": {
        # IMPORTANT: list every parent origin that will embed Superset
        "frame-ancestors": [
            "'self'",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        # (optional) sane defaults
        "default-src": ["'self'", "blob:", "data:"],
        "img-src": ["'self'", "data:", "blob:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
    },
}

# If your Next.js frontend calls Superset APIs directly from the browser
ENABLE_CORS = False
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
}


# Allow your Next.js app to frame Superset
OVERRIDE_HTTP_HEADERS = {
    "X-Frame-Options": "ALLOWALL",
    "Content-Security-Policy": "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000;"
}

# Keep embed features on
FEATURE_FLAGS = {"EMBEDDED_SUPERSET": True}


# Dev cookie defaults are fine; if you go cross-site + HTTPS later add:
# SESSION_COOKIE_SAMESITE = "None"
# SESSION_COOKIE_SECURE = True
