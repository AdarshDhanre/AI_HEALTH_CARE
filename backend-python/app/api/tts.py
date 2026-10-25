import re
import urllib.parse
import urllib.request
from typing import Dict, List
from fastapi import APIRouter, HTTPException, Query, Response

router = APIRouter(tags=["TTS"])

# Cache up to 500 audio clips in memory for instant playback
AUDIO_CACHE: Dict[str, bytes] = {}
CACHE_MAX_SIZE = 500

GOOGLE_TTS_LANG_MAP = {
    "hi": "hi",  # Hindi
    "mr": "mr",  # Marathi
    "gu": "gu",  # Gujarati
    "bn": "bn",  # Bengali
    "ta": "ta",  # Tamil
    "te": "te",  # Telugu
    "kn": "kn",  # Kannada
    "ml": "ml",  # Malayalam
    "pa": "pa",  # Punjabi
    "ur": "ur",  # Urdu
    "en": "en",  # English
    "or": "hi",  # Odia fallback
}


def _split_into_chunks(text: str, max_chars: int = 120) -> List[str]:
    """Split long paragraphs into natural sentence/clause chunks for TTS API limits."""
    # First split by major punctuation
    clauses = re.split(r"(?<=[।!?.\n,;])\s+", text)
    chunks = []

    for clause in clauses:
        clause = clause.strip()
        if not clause:
            continue
        if len(clause) <= max_chars:
            chunks.append(clause)
        else:
            # Split by words if a single clause exceeds max_chars
            words = clause.split()
            current = []
            current_len = 0
            for w in words:
                if current_len + len(w) + 1 > max_chars and current:
                    chunks.append(" ".join(current))
                    current = [w]
                    current_len = len(w)
                else:
                    current.append(w)
                    current_len += len(w) + 1
            if current:
                chunks.append(" ".join(current))

    return chunks or [text[:max_chars]]


def fetch_tts_audio(text: str, lang: str) -> bytes:
    """Fetch and concatenate MP3 audio for any Indian language."""
    clean_text = text.strip()
    if not clean_text:
        return b""

    target_lang = GOOGLE_TTS_LANG_MAP.get(lang.lower()[:2], "hi")
    cache_key = f"{target_lang}:{clean_text}"

    if cache_key in AUDIO_CACHE:
        return AUDIO_CACHE[cache_key]

    chunks = _split_into_chunks(clean_text, max_chars=120)
    audio_stream = bytearray()

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }

    for chunk in chunks:
        if not chunk.strip():
            continue
        encoded_query = urllib.parse.quote(chunk.strip())
        url = (
            f"https://translate.google.com/translate_tts"
            f"?ie=UTF-8&tl={target_lang}&client=tw-ob&q={encoded_query}"
        )
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                audio_stream.extend(response.read())
        except Exception as exc:
            # If a chunk fails, try fallback or continue
            print(f"TTS fetch error for chunk '{chunk}': {exc}")

    result_bytes = bytes(audio_stream)
    if result_bytes:
        if len(AUDIO_CACHE) >= CACHE_MAX_SIZE:
            AUDIO_CACHE.pop(next(iter(AUDIO_CACHE)))
        AUDIO_CACHE[cache_key] = result_bytes

    return result_bytes


@router.get("/tts")
def stream_tts(
    text: str = Query(..., description="Text to convert to natural voice"),
    lang: str = Query(default="hi", description="Language code (e.g. mr, hi, gu, ta, te, kn, bn, en)"),
):
    """
    Generate authentic native voice speech audio for all Indian languages and English.
    Streams an audio/mpeg MP3 response suitable for standard HTML5 Audio playback.
    """
    audio_data = fetch_tts_audio(text, lang)
    if not audio_data:
        raise HTTPException(status_code=500, detail="Could not generate speech audio")

    return Response(
        content=audio_data,
        media_type="audio/mpeg",
        headers={
            "Content-Type": "audio/mpeg",
            "Content-Disposition": "inline; filename=speech.mp3",
            "Cache-Control": "public, max-age=86400",
        },
    )
