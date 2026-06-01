import logging
import logging.config
import sys
from typing import Any

from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """JSON-style structured log formatter."""

    def format(self, record: logging.LogRecord) -> str:
        import json
        import traceback

        log_data: dict[str, Any] = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_data["exception"] = "".join(traceback.format_exception(*record.exc_info))

        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data, default=str)


def setup_logging() -> None:
    """Configure application logging."""
    log_level = logging.DEBUG if settings.is_development else logging.INFO

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    if settings.is_production:
        console_handler.setFormatter(JSONFormatter())
    else:
        fmt = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
        console_handler.setFormatter(logging.Formatter(fmt, datefmt="%Y-%m-%d %H:%M:%S"))

    root_logger.addHandler(console_handler)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("alembic").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger."""
    return logging.getLogger(name)
