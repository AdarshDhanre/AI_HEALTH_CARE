from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
from app.api import health, report, summary, translation, risk
=======
from app.api import health, report, summary, translation
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c

app = FastAPI(title="MediCase-AI Service", version="1.0.0",
              description="Internal AI service: OCR, extraction, rule-based flags, safe explanations.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
for r in (health.router, report.router, summary.router, translation.router, risk.router):
=======
for r in (health.router, report.router, summary.router, translation.router):
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
    app.include_router(r)

@app.get("/")
def root():
    return {
        "service": "MediCase-AI Service",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

