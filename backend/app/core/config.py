from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "IOMS"
    environment: str = "development"
    debug: bool = False
    version: str = "1.0.0"

    # Database
    database_url: str = "postgresql+asyncpg://ioms_user:ioms_password@localhost:5432/ioms_db"

    @field_validator("database_url")
    def validate_database_url(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Security
    secret_key: str = "default-secret-key-change-in-production"

    # CORS
    frontend_url: str = "http://localhost:5173"

    # Pagination defaults
    default_page_size: int = 10
    max_page_size: int = 100

    # Low stock threshold
    low_stock_threshold: int = 10

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"


settings = Settings()
