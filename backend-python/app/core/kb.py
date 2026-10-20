"""Loads the curated knowledge files (single source of truth for medical content)."""
import json
from functools import lru_cache
from app.core.config import KNOWLEDGE_DIR


@lru_cache(maxsize=None)
def _load_json(name: str):
    with open(KNOWLEDGE_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def knowledge_base() -> dict:
    return _load_json("knowledge_base.json")


def critical_values() -> dict:
    return _load_json("critical_values.json")


@lru_cache(maxsize=None)
def synonym_lookup() -> dict:
    """lower-case synonym -> canonical test name."""
    out = {}
    for canonical, names in _load_json("test_synonyms.json").items():
        out[canonical.lower()] = canonical
        for n in names:
            out[n.lower()] = canonical
    return out


@lru_cache(maxsize=None)
def prompt(name: str) -> str:
    with open(KNOWLEDGE_DIR / "prompts" / name, encoding="utf-8") as f:
        return f.read()
