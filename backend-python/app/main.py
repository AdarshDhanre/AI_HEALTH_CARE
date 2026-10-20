from fastapi import FastAPI
from app.api import health, report, summary, translation

app = FastAPI(title="MediCase-AI Service", version="1.0.0",
              description="Internal AI service: OCR, extraction, rule-based flags, safe explanations.")
for r in (health.router, report.router, summary.router, translation.router):
    app.include_router(r)
