# Architecture

```
React (Vite) --JWT--> Spring Boot (8080) --X-API-KEY--> FastAPI AI service (8000, internal)
                          |                                  OCR -> extract -> validate -> flags -> summary
                      PostgreSQL (Flyway)                    knowledge/*.json (curated medical content)
```
- Spring Boot owns users, roles (DOCTOR/PATIENT/ADMIN/RESEARCHER), data, audit and file storage.
- FastAPI is stateless and only reachable from Spring (shared key, not published by docker-compose).
