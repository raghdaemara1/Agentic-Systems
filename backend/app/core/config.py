from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite:///./backend/storage/app.db"

    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "llama3.1"
    ollama_embed_model: str = "nomic-embed-text"

    upload_dir: str = "./backend/storage/uploads"
    vector_dir: str = "./backend/storage/vector"

    allowed_origins: str = "http://localhost:5173"


settings = Settings()

