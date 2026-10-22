REQUIRED = [("chief_complaint", "Chief complaint"), ("medical_history", "Past medical history"),
            ("lifestyle", "Lifestyle (diet, sleep, activity)")]
AYUSH = [("prakriti", "Prakriti (body constitution)"), ("agni", "Agni (digestion)"),
         ("koshtha", "Koshtha (bowel habit)"), ("nidra", "Nidra (sleep)")]


def _empty(v) -> bool:
    return v is None or (isinstance(v, str) and not v.strip())


def find_missing(case: dict) -> list[dict]:
    out = [{"field": f, "label": l} for f, l in REQUIRED if _empty(case.get(f))]
    ay = case.get("ayush_details") or {}
    out += [{"field": f"ayush_details.{f}", "label": l} for f, l in AYUSH if _empty(ay.get(f))]
    return out
