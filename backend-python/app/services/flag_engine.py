"""Status flags come from deterministic rules, never from an LLM."""
from typing import Optional
from app.core.kb import critical_values
from app.services.validation_service import norm_unit


def is_critical(test_name: str, value: float, unit: Optional[str]) -> bool:
    entries = critical_values().get(test_name)
    if not entries:
        return False
    u = norm_unit(unit)
    for e in entries:
        if u in e["units"]:
            if e.get("low") is not None and value < e["low"]:
                return True
            if e.get("high") is not None and value > e["high"]:
                return True
    return False


def compute_flag(test_name: str, value: float, unit: Optional[str],
                 ref_low: Optional[float], ref_high: Optional[float]) -> str:
    if is_critical(test_name, value, unit):
        return "CRITICAL"
    if ref_low is None and ref_high is None:
        return "UNKNOWN"
    if ref_low is not None and value < ref_low:
        return "LOW"
    if ref_high is not None and value > ref_high:
        return "HIGH"
    return "NORMAL"
