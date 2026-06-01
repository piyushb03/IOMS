"""
Security utilities — CORS configuration and any future auth helpers.
No secrets are hardcoded here; all sensitive values come from environment variables.
"""
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


def get_cors_origins() -> list[str]:
    """Return allowed CORS origins based on environment."""
    origins = [settings.frontend_url]

    if settings.is_development:
        # Allow common local dev ports
        origins.extend(
            [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
            ]
        )

    return origins


CORS_CONFIG = {
    "allow_origins": get_cors_origins(),
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-Request-ID",
    ],
}

__all__ = ["CORSMiddleware", "CORS_CONFIG"]
