"""Normalise units and run sanity checks; anything suspicious is flagged for doctor review."""
from app.core.kb import knowledge_base

UNIT_ALIASES = {"gm/dl": "g/dl", "gms/dl": "g/dl", "g%": "g/dl", "gm%": "g/dl", "mg/dl.": "mg/dl",
                "uiu/ml": "uiu/ml", "µiu/ml": "uiu/ml", "miu/l": "miu/l"}


def norm_unit(unit):
    if not unit:
        return None
    u = unit.strip().lower().replace(" ", "").replace("µ", "u")
    return UNIT_ALIASES.get(u, u)


def validate(row: dict) -> dict:
    """Adds confidence, needs_review and review_reason to an extracted row."""
    reasons = []
    conf = 0.99
    if not row.get("unit"):
        reasons.append("unit missing")
        conf = min(conf, 0.7)
    if row.get("ref_low") is None and row.get("ref_high") is None:
        reasons.append("no reference range printed")
        conf = min(conf, 0.75)
    if row.get("ref_low") is not None and row.get("ref_high") is not None and row["ref_low"] > row["ref_high"]:
        reasons.append("reference range looks reversed")
        conf = min(conf, 0.5)

    param = knowledge_base()["parameters"].get(row["test_name"])
    plaus = param.get("plausible") if param else None
    if plaus:
        unit = norm_unit(row.get("unit"))
        if unit and unit in plaus["units"]:
            if not (plaus["min"] <= row["value"] <= plaus["max"]):
                reasons.append(f"value outside plausible range {plaus['min']}-{plaus['max']} (possible OCR error)")
                conf = min(conf, 0.4)
        elif unit:
            reasons.append(f"unexpected unit '{row['unit']}'")
            conf = min(conf, 0.6)
    row["confidence"] = round(conf, 2)
    row["needs_review"] = bool(reasons) and conf < 0.7
    row["review_reason"] = "; ".join(reasons) or None
    return row
