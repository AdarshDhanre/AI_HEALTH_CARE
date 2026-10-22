"""Mask obvious personal identifiers before any text is sent to an external LLM."""
import re

_PATTERNS = [
    (re.compile(r"(?im)^(\s*(?:patient\s*)?name\s*[:\-]).*$"), r"\1 [MASKED]"),
    (re.compile(r"(?im)^(\s*(?:referred\s*by|ref\.?\s*by|doctor|dr\.?)\s*[:\-]).*$"), r"\1 [MASKED]"),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]+\b"), "[EMAIL]"),
    (re.compile(r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)"), "[PHONE]"),
    (re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"), "[ID]"),
]


def mask(text: str) -> str:
    for pat, rep in _PATTERNS:
        text = pat.sub(rep, text)
    return text
