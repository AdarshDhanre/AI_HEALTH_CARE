# Multilingual Patient Pre-Consultation Interview

Added to MediCase-AI as a first implementation of the SIH-style patient intake workflow.

## What is included
- Patient-only page at `/patient-interview` after login.
- English, Marathi and Hindi interview labels.
- Structured patient-reported questions and a summary view.
- React calls the authenticated Spring Boot endpoint `POST /api/patient-interview/summary`.
- Spring Boot forwards to the internal FastAPI endpoint `POST /patient-interview/summary` using the existing AI service client and API-key configuration.
- Summary output is a faithful structured rendering of supplied answers; it does not invent a diagnosis.
- Existing Ayushman/Aadhaar scanner routes and Health Risk Assessment route are retained.

## Start / verify
1. Start PostgreSQL and Java backend as usual.
2. Start the existing Python AI backend on port 8000 using your current environment/configuration.
3. Start the React frontend.
4. Sign in with a `PATIENT` account and open **Patient Interview** in the sidebar.
5. Select English, Marathi or Hindi, answer the questions, and submit.
6. FastAPI docs should list `POST /patient-interview/summary` at `http://127.0.0.1:8000/docs`.

The FastAPI route is protected by the existing `X-API-KEY` dependency. Keep the shared API key configured identically for Java and Python; do not expose it in frontend code.

## Scope / next iteration
This version creates a summary in the response but does not persist interview answers or automatically attach the summary to a doctor/patient record. For production, add patient-consent capture, database persistence linked to the authenticated patient, doctor access checks, retention/deletion controls, and audited review. Urgent symptoms should never be delayed by the interview. OCR/interview output is not a diagnosis.
