# API (Spring Boot, JWT bearer)
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET/POST | /api/patients, GET /api/patients/{id} | doctor / patient |
| GET/POST | /api/patients/{id}/cases | POST doctor only |
| POST | /api/reports/upload | multipart: patientId, file, [reportDate, language] |
| GET | /api/patients/{id}/reports, /api/reports/{id}?language= | |
| PUT | /api/reports/{id}/results/{resultId} | doctor; recomputes flag |
| POST | /api/reports/{id}/confirm | doctor |
| GET | /api/patients/{id}/tests, /trends?test=, /compare, /dashboard | |
| GET/PUT | /api/admin/users, /api/admin/users/{id}/active?value= | admin |
| GET | /api/research/analytics, /api/research/cohort | researcher/admin, anonymised |

# AI service (internal, header X-API-KEY)
POST /process-report (file), /evaluate, /summary, /translate, /missing-info; GET /health
