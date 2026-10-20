"""Traffic-light levels and the mandatory disclaimer. No diagnosis, no prescriptions."""
LEVELS = {"NORMAL": "GREEN", "LOW": "YELLOW", "HIGH": "YELLOW", "CRITICAL": "RED", "UNKNOWN": "GREY"}

DISCLAIMER = {
    "en": "This explanation is for general understanding only. It is not a diagnosis or a prescription. Please discuss your report with a qualified doctor.",
    "hi": "यह व्याख्या केवल सामान्य जानकारी के लिए है। यह निदान या दवा की सलाह नहीं है। कृपया अपनी रिपोर्ट के बारे में योग्य डॉक्टर से चर्चा करें।",
    "mr": "हे स्पष्टीकरण फक्त सामान्य माहितीसाठी आहे. हे निदान किंवा औषधाचा सल्ला नाही. कृपया तुमच्या अहवालाबद्दल पात्र डॉक्टरांशी चर्चा करा.",
}


def level_for(flag: str) -> str:
    return LEVELS.get(flag, "GREY")


def overall_level(flags: list[str]) -> str:
    levels = {level_for(f) for f in flags}
    for lv in ("RED", "YELLOW"):
        if lv in levels:
            return lv
    if levels == {"GREEN"}:
        return "GREEN"
    return "GREEN" if "GREEN" in levels and levels <= {"GREEN", "GREY"} else "GREY"


def disclaimer(lang: str) -> str:
    return DISCLAIMER.get(lang, DISCLAIMER["en"])
