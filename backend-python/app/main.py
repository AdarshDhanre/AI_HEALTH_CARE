from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, report, summary, translation, risk, patient_interview, tts

app = FastAPI(title="MediCase-AI Service", version="1.0.0",
              description="Internal AI service: OCR, extraction, rule-based flags, safe explanations.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health.router, report.router, summary.router, translation.router, risk.router, patient_interview.router, tts.router):
    app.include_router(r)

@app.get("/")
def root():
    return {
        "service": "MediCase-AI Service",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }
