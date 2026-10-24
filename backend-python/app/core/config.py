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

<<<<<<< HEAD
<<<<<<< HEAD
    _backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
    model_config = SettingsConfigDict(env_file=(_backend_env, ".env"), extra="ignore")
=======
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
    _backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
    model_config = SettingsConfigDict(env_file=(_backend_env, ".env"), extra="ignore")
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)


settings = Settings()
