"""Food / lifestyle guidance comes only from the curated knowledge base (no free-form LLM advice)."""
from app.core.kb import knowledge_base

ALLOWED = {"VEGAN": {"vegan"}, "VEGETARIAN": {"vegan", "vegetarian"}, "NON_VEGETARIAN": {"vegan", "vegetarian", "nonveg"}}


def _loc(d: dict, lang: str) -> str:
    return d.get(lang) or d["en"]


def build_guidance(results: list[dict], lang: str, diet_pref: str) -> list[dict]:
    kb = knowledge_base()
    allowed = ALLOWED.get(diet_pref, ALLOWED["VEGETARIAN"])
    out = []
    for r in results:
        flag = r.get("flag")
        if flag not in ("LOW", "HIGH"):
            continue
        param = kb["parameters"].get(r["test_name"])
        g = param["guidance"].get(flag) if param else None
        if not g:
            continue
        foods = [_loc(kb["foods"][k]["name"], lang) for k in g["foods"] if kb["foods"][k]["diet"] in allowed]
        tips = [_loc(kb["tips"][k], lang) for k in g["tips"]]
        out.append({"test_name": r["test_name"], "flag": flag, "foods": foods, "tips": tips})
    return out
