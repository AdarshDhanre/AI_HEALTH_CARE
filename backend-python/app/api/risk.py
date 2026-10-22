from fastapi import APIRouter, Depends
from app.core.security import verify_api_key
from app.schemas.risk_schema import (
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    SymptomTextAnalysisRequest,
    SymptomTextAnalysisResponse,
)
from app.services import risk_engine

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.post("/predict-risk", response_model=RiskAssessmentResponse)
def predict_risk(req: RiskAssessmentRequest):
    return risk_engine.assess_health_risk(req)


@router.post("/analyze-symptom-text", response_model=SymptomTextAnalysisResponse)
def analyze_symptom_text(req: SymptomTextAnalysisRequest):
    return risk_engine.analyze_freeform_symptoms(req)
