from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str = "fallback_secret_key_for_dev_only"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    RESEND_API_KEY: str = ""
    
    # Allows loading from .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
