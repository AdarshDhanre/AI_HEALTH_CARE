"""Rule-based extraction: synonym match at line start, then value, unit and printed reference range."""
import re
from datetime import date
from typing import Optional
from app.core.kb import synonym_lookup

NUM = r"\d+(?:,\d{3})*(?:\.\d+)?"
UNIT = r"(?:x?10[\^³]\d+/\w+|/[A-Za-z0-9.]+|[A-Za-z%µ][A-Za-z0-9%^/.µ³]*(?:\s?/\s?[A-Za-z0-9.]+)?)"
VALUE_RE = re.compile(rf"^[\s:\-|]*(?P<val>{NUM})\s*(?P<unit>{UNIT})?")
RANGE_RE = re.compile(rf"(?P<lo>{NUM})\s*(?:-|–|—|to)\s*(?P<hi>{NUM})")
LT_RE = re.compile(rf"(?:<|upto|up to|less than)\s*=?\s*(?P<hi>{NUM})", re.I)
GT_RE = re.compile(rf"(?:>|more than|greater than)\s*=?\s*(?P<lo>{NUM})", re.I)
NOT_UNITS = {"h", "l", "high", "low", "h)", "l)", "normal", "h*", "l*"}
DATE_PATTERNS = [
    (re.compile(r"(\d{4})-(\d{2})-(\d{2})"), "ymd"),
    (re.compile(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})"), "dmy"),
]
DATE_KEYS = re.compile(r"(report(ed)?|collect(ed|ion)|sample|date)", re.I)


def _num(s: str) -> float:
    return float(s.replace(",", ""))


def _synonyms_sorted() -> list[tuple[str, str]]:
    return sorted(synonym_lookup().items(), key=lambda kv: -len(kv[0]))


def match_test(line: str) -> Optional[tuple[str, str, str]]:
    """-> (canonical, raw_name, remainder) if the line starts with a known test name."""
    low = line.lower().lstrip()
    offset = len(line) - len(line.lstrip())
    for syn, canonical in _synonyms_sorted():
        if low.startswith(syn):
            nxt = low[len(syn):len(syn) + 1]
            if nxt and (nxt.isalnum()):
                continue
            end = offset + len(syn)
            return canonical, line[offset:end], line[end:]
    return None


def parse_line(line: str) -> Optional[dict]:
    m = match_test(line.strip())
    if not m:
        cleaned = re.sub(r"^[\s\d|~)\-.:?#*]+\s*", "", line)
        if cleaned != line.strip():
            m = match_test(cleaned)
    if not m:
        return None
    canonical, raw, rest = m
    v = VALUE_RE.match(rest)
    if not v:
        return None
    unit = v.group("unit")
    if unit and unit.lower() in NOT_UNITS:
        unit = None
    tail = rest[v.end():]
    ref_low = ref_high = None
    ref_text = None
    r = RANGE_RE.search(tail)
    if r:
        ref_low, ref_high, ref_text = _num(r.group("lo")), _num(r.group("hi")), r.group(0).strip()
    else:
        lt, gt = LT_RE.search(tail), GT_RE.search(tail)
        if lt:
            ref_high, ref_text = _num(lt.group("hi")), lt.group(0).strip()
        elif gt:
            ref_low, ref_text = _num(gt.group("lo")), gt.group(0).strip()
    return {"test_name": canonical, "raw_name": raw.strip(), "value": _num(v.group("val")),
            "unit": unit, "ref_low": ref_low, "ref_high": ref_high, "ref_text": ref_text}


def extract_results(text: str) -> list[dict]:
    out, seen = [], set()
    for line in text.splitlines():
        row = parse_line(line)
        if row and row["test_name"] not in seen:
            seen.add(row["test_name"])
            out.append(row)
    return out


def extract_report_date(text: str) -> Optional[str]:
    candidates = []
    for line in text.splitlines()[:60]:
        if not DATE_KEYS.search(line):
            continue
        for pat, kind in DATE_PATTERNS:
            for m in pat.finditer(line):
                try:
                    y, mo, d = (int(m.group(1)), int(m.group(2)), int(m.group(3))) if kind == "ymd" \
                        else (int(m.group(3)), int(m.group(2)), int(m.group(1)))
                    candidates.append(date(y, mo, d))
                except ValueError:
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
                    if kind == "dmy":
                        try:
                            candidates.append(date(int(m.group(3)), int(m.group(1)), int(m.group(2))))
                        except ValueError:
                            pass
<<<<<<< HEAD
=======
                    pass
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
    return max(candidates).isoformat() if candidates else None


def extract_lab_name(text: str) -> Optional[str]:
    for line in text.splitlines()[:8]:
        s = line.strip()
        if len(s) > 4 and re.search(r"(lab|diagnos|pathology|clinic|hospital|health)", s, re.I):
            return s[:120]
    return None
