import secrets
from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_api_key(x_api_key: str = Header(default="")):
    """Only the Spring Boot backend (which knows the shared key) may call this service."""
    if not secrets.compare_digest(x_api_key, settings.internal_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
