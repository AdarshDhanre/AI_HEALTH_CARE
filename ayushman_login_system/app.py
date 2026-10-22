
import os
import shutil
from pathlib import Path
import io
import re

import joblib
import pytesseract
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Model file path - resolve relative to this file
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "field_classifier.joblib"

# Tesseract executable path on your Windows system
tesseract_candidates = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe\tesseract.exe",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    shutil.which("tesseract")
]
for cand in tesseract_candidates:
    if cand and os.path.isfile(cand):
        pytesseract.pytesseract.tesseract_cmd = cand
        tessdata = os.path.join(os.path.dirname(cand), "tessdata")
        if os.path.exists(tessdata):
            os.environ["TESSDATA_PREFIX"] = tessdata
        break

app = FastAPI(
    title="HealthLens AI OCR Prototype",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_model():
    if not MODEL_PATH.exists():
        return None

    try:
        return joblib.load(MODEL_PATH)
    except Exception as exc:
        print(f"Could not load model: {exc}")
        return None


model = load_model()


def parse_card_fields(raw_text: str, lines: list[dict]) -> dict:
    fields = {
        "name": None,
        "dob": None,
        "gender": None,
        "pmjay_id": None,
        "reference": None,
    }

    full_text = "\n".join([item["text"] for item in lines]) if lines else raw_text

    # --- PM-JAY ID / ABHA ID / Reference ---
    pmjay_match = re.search(
        r"(?:(?:PM[- ]?JAY|AYUSHMAN)\s*(?:ID|NO|NUMBER)|(?:PM[- ]?JAY|ABHA)\s*:)[:\s]*([A-Z0-9\-]{4,})",
        full_text,
        re.IGNORECASE
    )
    if pmjay_match:
        fields["pmjay_id"] = pmjay_match.group(1).strip()

    # ABHA standard 14 digit format (e.g. 12-3456-7890-1234)
    abha_match = re.search(r"\b(\d{2}-\d{4}-\d{4}-\d{4})\b", full_text)
    if abha_match:
        fields["pmjay_id"] = fields["pmjay_id"] or abha_match.group(1)

    # Reference / Demo ID pattern (e.g. DEMO-123456 or Reference: ...)
    ref_match = re.search(
        r"(?:Reference|Ref(?:\s*No)?|Card\s*ID)[:\s]*([A-Z0-9\-]+)",
        full_text,
        re.IGNORECASE
    )
    if ref_match:
        fields["reference"] = ref_match.group(1).strip()

    demo_ref = re.search(r"\b(DEMO-\d{4,8})\b", full_text, re.IGNORECASE)
    if demo_ref:
        fields["reference"] = fields["reference"] or demo_ref.group(1)
        if not fields["pmjay_id"]:
            fields["pmjay_id"] = demo_ref.group(1)

    # --- Date of Birth ---
    dob_match = re.search(
        r"(?:Date\s*of\s*Birth|DOB|Birth\s*Date|Janam\s*Tithi)[:\s]*([0-9]{1,2}[/\-.][0-9]{1,2}[/\-.][0-9]{2,4})",
        full_text,
        re.IGNORECASE
    )
    if dob_match:
        fields["dob"] = dob_match.group(1).strip()
    else:
        # Standalone date e.g. 26/05/1983 or 1983-05-26
        date_match = re.search(r"\b([0-3]?[0-9][/\-.][0-1]?[0-9][/\-.](?:19|20)\d{2})\b", full_text)
        if date_match:
            fields["dob"] = date_match.group(1)
        else:
            # Year of Birth (YOB)
            yob_match = re.search(
                r"(?:Year\s*of\s*Birth|YOB|Janam\s*Varsh)[:\s]*((?:19|20)\d{2})",
                full_text,
                re.IGNORECASE
            )
            if yob_match:
                fields["dob"] = yob_match.group(1)

    # --- Gender ---
    gender_match = re.search(
        r"(?:Gender|Sex|Linga)[:\s]*(Male|Female|Transgender|Other|M|F)\b",
        full_text,
        re.IGNORECASE
    )
    if gender_match:
        g = gender_match.group(1).upper()
        if g in ("M", "MALE"):
            fields["gender"] = "Male"
        elif g in ("F", "FEMALE"):
            fields["gender"] = "Female"
        else:
            fields["gender"] = gender_match.group(1).capitalize()
    else:
        standalone_gender = re.search(r"\b(Male|Female|Transgender)\b", full_text, re.IGNORECASE)
        if standalone_gender:
            fields["gender"] = standalone_gender.group(1).capitalize()

    # --- Name ---
    name_match = re.search(
        r"(?:Beneficiary\s*Name|Patient\s*Name|Name|Naam)[:\s]*([A-Za-z\.\'\- ]+)",
        full_text,
        re.IGNORECASE
    )
    if name_match:
        cand = name_match.group(1).splitlines()[0].strip()
        cand = re.sub(r"[\n\r\|_]", "", cand).strip()
        if len(cand) >= 2:
            fields["name"] = cand

    # Model-fallback for any missing fields
    for item in lines:
        predicted = item.get("field")
        text = item.get("text", "").strip()

        if predicted == "name" and not fields["name"]:
            cleaned = re.sub(r"^(?:Beneficiary\s*Name|Patient\s*Name|Name|Naam)[:\s]*", "", text, flags=re.IGNORECASE).strip()
            if len(cleaned) >= 2 and not any(kw in cleaned.lower() for kw in ["health", "card", "demo", "government", "ayushman"]):
                fields["name"] = cleaned

        elif predicted == "dob" and not fields["dob"]:
            cleaned = re.sub(r"^(?:Date\s*of\s*Birth|DOB|Birth\s*Date)[:\s]*", "", text, flags=re.IGNORECASE).strip()
            if cleaned:
                fields["dob"] = cleaned

        elif predicted == "gender" and not fields["gender"]:
            cleaned = re.sub(r"^(?:Gender|Sex)[:\s]*", "", text, flags=re.IGNORECASE).strip()
            if cleaned in ("Male", "Female", "Transgender", "Other"):
                fields["gender"] = cleaned

        elif predicted == "reference" and not fields["reference"]:
            cleaned = re.sub(r"^(?:Reference|Ref|ID)[:\s]*", "", text, flags=re.IGNORECASE).strip()
            if cleaned and not any(kw in cleaned.lower() for kw in ["health", "demo"]):
                fields["reference"] = cleaned
                if not fields["pmjay_id"]:
                    fields["pmjay_id"] = cleaned

    return fields


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "purpose": "synthetic OCR demo"
    }


@app.post("/extract")
async def extract(file: UploadFile = File(...)):

    allowed_types = {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Upload PNG, JPEG, or WEBP image only."
        )

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be 5 MB or smaller."
        )

    try:
        image = Image.open(io.BytesIO(content))
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read image."
        )
    finally:
        await file.close()

    # Enhanced image preprocessing for OCR accuracy
    image = ImageOps.grayscale(image)
    image = ImageOps.autocontrast(image)
    image = image.resize(
        (image.width * 2, image.height * 2)
    )
    image = ImageEnhance.Contrast(image).enhance(1.5)
    image = image.filter(ImageFilter.SHARPEN)

    try:
        raw_text = pytesseract.image_to_string(
            image,
            config="--oem 3 --psm 6"
        )
    except Exception as e1:
        try:
            # Fallback to default PSM if PSM 6 fails
            raw_text = pytesseract.image_to_string(image)
        except Exception as e2:
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"OCR failed: {e2}. Check Tesseract installation."
            )

    lines = [
        line.strip()
        for line in raw_text.splitlines()
        if line.strip()
    ]

    if model is None:
        labels = [
            {"text": line, "field": "unclassified"}
            for line in lines
        ]
    else:
        labels = [
            {
                "text": line,
                "field": str(model.predict([line])[0])
            }
            for line in lines
        ]

    extracted_fields = parse_card_fields(raw_text, labels)

    return JSONResponse({
        "extraction_only": True,
        "identity_verified": False,
        "warning": (
            "OCR output may be inaccurate. "
            "Review extracted fields and verify identity separately."
        ),
        "extracted_fields": extracted_fields,
        "raw_text": raw_text,
        "lines": labels
    })
