from typing import Dict, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.core.security import verify_api_key

router = APIRouter(prefix="/patient-interview", tags=["patient-interview"], dependencies=[Depends(verify_api_key)])

class InterviewRequest(BaseModel):
    language: str = "en"
    answers: Dict[str, Optional[str]] = Field(default_factory=dict)

LABELS = {
    "en": {"complaint":"Main concern","onset":"Started","duration":"Duration / change","severity":"Severity","symptoms":"Other symptoms","history":"Medical history","medicines":"Medicines / supplements","allergies":"Allergies","notes":"Additional information","unknown":"Not provided","disclaimer":"Patient-reported information only. This summary is not a diagnosis; clinician review is required."},
    "mr": {"complaint":"मुख्य त्रास","onset":"त्रास सुरू झाल्याची वेळ","duration":"कालावधी / बदल","severity":"तीव्रता","symptoms":"इतर लक्षणे","history":"वैद्यकीय इतिहास","medicines":"औषधे / पूरक पदार्थ","allergies":"ॲलर्जी","notes":"अतिरिक्त माहिती","unknown":"माहिती दिलेली नाही","disclaimer":"ही माहिती रुग्णाने दिलेली आहे. हा निदानाचा पर्याय नाही; डॉक्टरांनी तपासणे आवश्यक आहे."},
    "hi": {"complaint":"मुख्य परेशानी","onset":"शुरू होने का समय","duration":"अवधि / बदलाव","severity":"गंभीरता","symptoms":"अन्य लक्षण","history":"चिकित्सा इतिहास","medicines":"दवाएं / सप्लीमेंट","allergies":"एलर्जी","notes":"अतिरिक्त जानकारी","unknown":"जानकारी नहीं दी गई","disclaimer":"यह जानकारी मरीज द्वारा दी गई है। यह निदान नहीं है; डॉक्टर द्वारा समीक्षा आवश्यक है।"}
}

@router.post("/summary")
def create_summary(req: InterviewRequest):
    lang = req.language if req.language in LABELS else "en"
    labels = LABELS[lang]
    order = ("complaint","onset","duration","severity","symptoms","history","medicines","allergies","notes")
    lines = []
    for key in order:
        value = (req.answers.get(key) or "").strip()
        lines.append(f"{labels[key]}: {value if value else labels['unknown']}")
    return {"language": lang, "summary": "\n".join(lines), "disclaimer": labels["disclaimer"], "source": "patient_reported"}
