import logging
from app.core.config import settings
from app.core.kb import prompt

log = logging.getLogger(__name__)
NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi"}


def translate(text: str, target: str) -> dict:
    if settings.llm_provider == "none":
        return {"translated": False, "text": text, "note": "LLM disabled; returned original text"}
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.llm_api_key or "none", base_url=settings.llm_base_url or None)
        r = client.chat.completions.create(
            model=settings.llm_model, temperature=0,
            messages=[{"role": "system", "content": prompt("translate_prompt.txt").replace("{language}", NAMES.get(target, target))},
                      {"role": "user", "content": text}])
        return {"translated": True, "text": r.choices[0].message.content.strip()}
    except Exception as e:
        log.warning("translate failed: %s", e)
        return {"translated": False, "text": text, "note": "translation failed"}
