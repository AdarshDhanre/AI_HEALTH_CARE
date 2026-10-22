from fastapi import APIRouter, Depends
from app.core.security import verify_api_key
from app.schemas.summary_schema import TranslateRequest
from app.services import translation_service

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.post("/translate")
def translate(req: TranslateRequest):
    return translation_service.translate(req.text, req.target_language)
