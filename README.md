# MediCase-AI

Lab-report understanding for AYUSH / general practitioners and patients: OCR + rule-based flags + safe, multilingual (EN/HI/MR) explanations.
Not a diagnostic tool - see `docs/safety-policy.md`.

## Run with Docker
```bash
cp .env.example .env      # change the secrets
docker compose up --build
# backend http://localhost:8080   (first admin = ADMIN_EMAIL / ADMIN_PASSWORD)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

## Run locally (no Docker)
1. PostgreSQL: create db `medicase`, user `medicase` (see `backend-java/.env.example`).
2. AI service: `cd backend-python && pip install -r requirements.txt && uvicorn app.main:app --port 8000`
   (Windows: install Tesseract + Poppler and set `TESSERACT_CMD` / `POPPLER_PATH` in `.env`).
3. Backend: `cd backend-java && mvn spring-boot:run -Dspring-boot.run.profiles=dev`
4. Frontend: `cd frontend && npm install && npm run dev`

Sign up as **Doctor**, register a patient, upload a report.
