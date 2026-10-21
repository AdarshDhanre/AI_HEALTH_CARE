# HealthLens AI — OCR + Custom ML Starter

This is an educational prototype for card-image text extraction and field classification.
It uses synthetic card images only. It does NOT verify Ayushman eligibility or authenticate a real patient.

## Architecture
- Python FastAPI: OCR + trained text-line classifier
- Synthetic data generator: creates fake card images and labeled text lines
- scikit-learn: trains a custom line-to-field classifier
- Spring Boot: should own patient accounts, verification, sessions, authorization and database access

## Requirements
- Python 3.10–3.12 recommended
- Tesseract OCR installed separately:
  - Windows: install Tesseract OCR, then add its installation directory to PATH
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`

## Setup (Windows PowerShell)
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python generate_synthetic_dataset.py
python train_model.py
uvicorn app:app --reload --host 127.0.0.1 --port 8001
```

Open `http://127.0.0.1:8001/docs` to test the API.
For the first test, upload an image generated under `data/synthetic_cards/`.

## API
`POST /extract`
- multipart form field: `file`
- returns OCR text and predicted field labels
- this endpoint is for extraction only, NOT identity verification

`GET /health`
- service status

## Important security boundaries
- Never treat OCR output or possession of a card image as proof of identity.
- Do not store passwords, OTPs, full card identifiers, QR contents, or raw card images in model training data.
- Use synthetic data unless you have documented authorization and a lawful purpose for real data.
- In production, Spring Boot must perform identity verification through an authorized mechanism before linking/creating an account.
- Use password hashing (Argon2id or BCrypt), rate limiting, CSRF protections where applicable, secure cookies, audit logs, and least-privilege access.
- Do not expose this development server publicly. Add authentication, size limits, content validation, malware scanning, and retention/deletion rules before production.

## About the custom model
The model classifies OCR text lines into broad field categories using synthetic examples.
This demonstrates a train/evaluate pipeline; it is NOT trained to identify official Ayushman card layouts and will not be reliable on real cards without representative, authorized, labeled data and evaluation.
