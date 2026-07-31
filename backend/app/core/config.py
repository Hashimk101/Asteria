import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Asteria REST API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = ""
    
    # Secrets & Config
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/postgres",
        validation_alias="DATABASE_URL"
    )
    NASA_API_KEY: str = Field(
        default="DEMO_KEY",
        validation_alias="NASA_API_KEY"
    )
    PORT: int = 8000
    CORS_ORIGINS: Union[str, List[str]] = "*"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if not v or v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
