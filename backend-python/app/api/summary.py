from fastapi import APIRouter, Depends
from app.core.security import verify_api_key
from app.schemas.summary_schema import MissingInfoRequest, SummaryRequest
from app.services import ai_summary, guidance_service, missing_info_service, safety_service

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.post("/summary")
def summary(req: SummaryRequest):
    lang = req.language if req.language in ("en", "hi", "mr") else "en"
    results = [r.model_dump() for r in req.results]
    return {"language": lang,
            "overall_level": safety_service.overall_level([r["flag"] for r in results]),
            "summary_text": ai_summary.build_summary(results, lang),
            "guidance": guidance_service.build_guidance(results, lang, req.diet_pref),
            "disclaimer": safety_service.disclaimer(lang)}


@router.post("/missing-info")
def missing_info(req: MissingInfoRequest):
    return {"missing": missing_info_service.find_missing(req.case)}
