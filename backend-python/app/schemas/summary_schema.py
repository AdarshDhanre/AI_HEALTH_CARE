from typing import Optional
from pydantic import BaseModel


class SummaryItem(BaseModel):
    test_name: str
    value: float
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    flag: str = "UNKNOWN"


class SummaryRequest(BaseModel):
    language: str = "en"
    diet_pref: str = "VEGETARIAN"
    results: list[SummaryItem]


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "hi"


class MissingInfoRequest(BaseModel):
    case: dict
