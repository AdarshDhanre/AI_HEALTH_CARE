from typing import Optional
from pydantic import BaseModel


class LabResultOut(BaseModel):
    test_name: str
    raw_name: Optional[str] = None
    value: float
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    ref_text: Optional[str] = None
    flag: str = "UNKNOWN"
    safety_level: str = "GREY"
    confidence: float = 0.0
    needs_review: bool = False
    review_reason: Optional[str] = None


class ProcessResponse(BaseModel):
    extraction_method: str
    lab_name: Optional[str] = None
    report_date: Optional[str] = None
    overall_level: str = "GREY"
    results: list[LabResultOut]
    warnings: list[str] = []


class EvalRequest(BaseModel):
    test_name: str
    value: float
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None


class EvalResponse(BaseModel):
    flag: str
    safety_level: str
