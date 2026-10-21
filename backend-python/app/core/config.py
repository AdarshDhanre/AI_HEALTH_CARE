from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"


class Settings(BaseSettings):
    internal_api_key: str = "change-me-internal-key"
    llm_provider: str = "none"          # none | openai (OpenAI-compatible)
    llm_api_key: str = ""
    llm_base_url: str = ""
    llm_model: str = "gpt-4o-mini"
    tesseract_cmd: str = ""
    poppler_path: str = ""
    ocr_languages: str = "eng"
    max_upload_mb: int = 10

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
