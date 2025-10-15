"""
Application configuration settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str
    POSTGRES_USER: str = "mo7ami_user"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "mo7ami"

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"  # Changed from gpt-4-turbo-preview (GPT-5 doesn't exist)
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # Google Cloud (Speech services)
    GOOGLE_CLOUD_PROJECT_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # Azure Speech (alternative)
    AZURE_SPEECH_KEY: str = ""
    AZURE_SPEECH_REGION: str = ""

    # Voice / Speech-to-Text
    VOICE_STT_PROVIDER: str = "faster-whisper"  # Options: faster-whisper, openai
    VOICE_STT_MODEL_SIZE: str = "base"
    VOICE_STT_DEVICE: str = "cpu"
    VOICE_STT_COMPUTE_TYPE: str = "int8"  # int8/int16/float16/float32 depending on hardware
    VOICE_STT_TIMEOUT_SECONDS: int = 15

    # Vector Store Configuration
    VECTOR_DIMENSION: int = 1536
    MAX_CONTEXT_LENGTH: int = 4096
    TOP_K_RESULTS: int = 5

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 900  # 15 minutes in seconds

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/mo7ami.log"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
