"""Plain-language summary. Template by default; optional LLM rewrite that may only restate given facts."""
import logging
from app.core.config import settings
from app.core.kb import knowledge_base, prompt
from app.services import safety_service

log = logging.getLogger(__name__)

T = {
    "en": {"head": "{n} tests were read from your report: {ok} within the reference range, {off} outside it, {crit} needing urgent attention.",
           "LOW": "your value is below the reference range given in your report.",
           "HIGH": "your value is above the reference range given in your report.",
           "CRITICAL": "your value is far outside the usual range and needs prompt medical attention. Please contact a doctor soon.",
           "UNKNOWN": "no reference range was printed, so this could not be assessed.",
           "tail": "Please discuss these results, especially if they persist or you have symptoms, with a healthcare professional.",
           "none": "No tests could be read from this report."},
    "hi": {"head": "आपकी रिपोर्ट से {n} जाँचें पढ़ी गईं: {ok} संदर्भ सीमा के भीतर, {off} सीमा से बाहर, {crit} पर तुरंत ध्यान देने की ज़रूरत।",
           "LOW": "आपका मान आपकी रिपोर्ट में दी गई संदर्भ सीमा से कम है।",
           "HIGH": "आपका मान आपकी रिपोर्ट में दी गई संदर्भ सीमा से अधिक है।",
           "CRITICAL": "आपका मान सामान्य सीमा से बहुत दूर है और तुरंत चिकित्सकीय ध्यान की ज़रूरत है। कृपया जल्द डॉक्टर से संपर्क करें।",
           "UNKNOWN": "संदर्भ सीमा नहीं छपी थी, इसलिए इसका आकलन नहीं हो सका।",
           "tail": "कृपया इन परिणामों के बारे में, खासकर यदि ये बने रहें या लक्षण हों, स्वास्थ्य विशेषज्ञ से चर्चा करें।",
           "none": "इस रिपोर्ट से कोई जाँच नहीं पढ़ी जा सकी।"},
    "mr": {"head": "तुमच्या अहवालातून {n} चाचण्या वाचल्या: {ok} संदर्भ मर्यादेत, {off} मर्यादेबाहेर, {crit} साठी तातडीने लक्ष देण्याची गरज.",
           "LOW": "तुमचे मूल्य तुमच्या अहवालात दिलेल्या संदर्भ मर्यादेपेक्षा कमी आहे.",
           "HIGH": "तुमचे मूल्य तुमच्या अहवालात दिलेल्या संदर्भ मर्यादेपेक्षा जास्त आहे.",
           "CRITICAL": "तुमचे मूल्य सामान्य मर्यादेपासून खूप दूर आहे आणि तातडीने वैद्यकीय लक्ष आवश्यक आहे. कृपया लवकर डॉक्टरांशी संपर्क साधा.",
           "UNKNOWN": "संदर्भ मर्यादा छापलेली नव्हती, त्यामुळे याचे मूल्यमापन करता आले नाही.",
           "tail": "कृपया या निकालांबद्दल, विशेषतः ते कायम राहिल्यास किंवा लक्षणे असल्यास, आरोग्य तज्ज्ञांशी चर्चा करा.",
           "none": "या अहवालातून कोणत्याही चाचण्या वाचता आल्या नाहीत."},
}


def _name(test: str, lang: str) -> str:
    p = knowledge_base()["parameters"].get(test)
    return (p["names"].get(lang) or test) if p else test


def _meaning(test: str, lang: str) -> str:
    p = knowledge_base()["parameters"].get(test)
    return (p["meaning"].get(lang) or p["meaning"]["en"]) if p else ""


def template_summary(results: list[dict], lang: str) -> str:
    t = T.get(lang, T["en"])
    if not results:
        return t["none"]
    ok = sum(1 for r in results if r["flag"] == "NORMAL")
    crit = sum(1 for r in results if r["flag"] == "CRITICAL")
    off = sum(1 for r in results if r["flag"] in ("LOW", "HIGH"))
    lines = [t["head"].format(n=len(results), ok=ok, off=off, crit=crit)]
    for r in results:
        if r["flag"] in ("LOW", "HIGH", "CRITICAL", "UNKNOWN"):
            lines.append(f"{_name(r['test_name'], lang)}: {t[r['flag']]} {_meaning(r['test_name'], lang)}")
    lines.append(t["tail"])
    return "\n".join(lines)


def _llm_rewrite(facts: str, lang: str):
    from openai import OpenAI
    client = OpenAI(api_key=settings.llm_api_key or "none", base_url=settings.llm_base_url or None)
    resp = client.chat.completions.create(
        model=settings.llm_model, temperature=0.2,
        messages=[{"role": "system", "content": prompt("summary_prompt.txt").replace("{language}", lang)},
                  {"role": "user", "content": facts}])
    return resp.choices[0].message.content.strip()


def build_summary(results: list[dict], lang: str) -> str:
    base = template_summary(results, lang)
    if settings.llm_provider == "none" or not results:
        return base
    try:
        return _llm_rewrite(base, lang) or base
    except Exception as e:  # LLM is an enhancement only
        log.warning("LLM rewrite failed, using template: %s", e)
        return base
