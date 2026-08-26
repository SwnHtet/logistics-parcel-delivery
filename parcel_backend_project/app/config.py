from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Default is SQLite so the project runs instantly with zero setup.
    # For real use, set DATABASE_URL in a .env file, e.g.:
    #   postgresql://user:password@localhost:5432/parcel_delivery
    database_url: str = "sqlite:///./parcel_delivery.db"

    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
