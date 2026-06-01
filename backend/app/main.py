"""
IOMS — Intelligent Inventory & Order Management System
FastAPI Application Entry Point
"""
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import customers, dashboard, orders, products
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.core.security import CORS_CONFIG
from app.db.database import dispose_engine

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(
        "Starting %s v%s in %s mode",
        settings.app_name,
        settings.version,
        settings.environment,
    )
    yield
    await dispose_engine()
    logger.info("%s shutdown complete.", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    description="Intelligent Inventory & Order Management System — Production API",
    version=settings.version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(CORSMiddleware, **CORS_CONFIG)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every incoming request with timing."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %s %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ── Exception Handlers ────────────────────────────────────────────────────────

def _error_response(status_code: int, message: str, detail: Any = None) -> JSONResponse:
    body: dict[str, Any] = {"success": False, "message": message}
    if detail:
        body["detail"] = detail
    return JSONResponse(status_code=status_code, content=body)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    messages: dict[int, str] = {
        400: "Bad request.",
        401: "Unauthorised.",
        403: "Forbidden.",
        404: "Resource not found.",
        405: "Method not allowed.",
        409: "Conflict — resource already exists.",
        422: "Validation error.",
        500: "Internal server error.",
    }
    message = exc.detail if isinstance(exc.detail, str) else messages.get(exc.status_code, "Error.")
    logger.warning("HTTP %s: %s — %s", exc.status_code, request.url.path, message)
    return _error_response(exc.status_code, message)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append(f"{field}: {error['msg']}" if field else error["msg"])
    message = "; ".join(errors) if errors else "Validation failed."
    logger.warning("Validation error on %s: %s", request.url.path, message)
    return _error_response(status.HTTP_422_UNPROCESSABLE_ENTITY, message, errors)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s: %s", request.url.path, exc)
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "An unexpected error occurred. Please try again later.",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(products.router, prefix=API_PREFIX)
app.include_router(customers.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check endpoint for deployment platforms."""
    return {"status": "healthy", "version": settings.version}


@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint — application metadata."""
    return {
        "name": settings.app_name,
        "version": settings.version,
        "environment": settings.environment,
        "docs": "/docs",
    }
