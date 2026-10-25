# MediCase-AI 🏥
### AI-Powered Multilingual Healthcare & Clinical Intelligence Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI%20Python-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract%205.0-blue)](https://github.com/tesseract-ocr/tesseract)
[![Languages](https://img.shields.io/badge/Languages-12%20Indian%20Languages-orange)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Overview

**MediCase-AI** is a modern, full-stack healthcare intelligence system engineered to assist general practitioners, AYUSH practitioners, and patients across India. It bridges medical comprehension and language barriers by providing:

1. **Intelligent Lab Report OCR & Value Extraction** (CBC, Lipid, Renal, Liver panels with rule-based flagging).
2. **Ayushman Bharat & Aadhaar Card Auto-Scanning** (Frictionless patient onboarding via computer vision).
3. **Multilingual AI Doctor Voice Consultation** (Voice and text symptom intake with authentic native audio responses across 12 Indian languages).
4. **Early Health Risk Stratification** (Type-2 Diabetes, Hypertension, and Cardiovascular risk assessments).
5. **Real-Time Emergency Triaging** (Immediate auditory and visual critical warnings for high-risk symptoms).

> ⚠️ **Clinical Safety Notice**: MediCase-AI provides preliminary decision support and educational guidance. It is **not** a replacement for clinical diagnosis by licensed medical practitioners.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend Client (:5173)"]
        UI["React 18 + Vite + Tailwind CSS"]
        STT["Web Speech Recognition (Voice Input)"]
        Audio["HTML5 Native Audio Player (TTS Stream)"]
    end

    subgraph CoreBackend["⚙️ Core Backend (:8080)"]
        GW["Spring Boot 3.5 REST API"]
        SEC["Spring Security + JWT Authentication"]
        Flyway["Flyway Database Migrations"]
        JPA["Spring Data JPA / Hibernate"]
    end

    subgraph AIServices["🧠 AI Microservices"]
        PY_AI["FastAPI AI Service (:8000)\n- Clinical Rule Engine\n- Synonym Mapping\n- Multilingual Explanations"]
        OCR_SVC["Ayushman & Aadhaar OCR Service (:8001)\n- Tesseract OCR Engine\n- Image Preprocessing\n- Field Classifier"]
        TTS_SVC["Native Indian TTS Engine\n- Marathi, Hindi, Gujarati, Tamil, etc.\n- In-Memory Audio Caching"]
    end

    subgraph Storage["💾 Persistence Layer"]
        PG[("PostgreSQL 15+\n- Patients, Records, Cases, Risk Profiles")]
    end

    UI -->|HTTP / REST + JWT| GW
    GW --> JPA
    JPA --> PG
    Flyway --> PG
    GW -->|Internal REST| PY_AI
    GW -->|WebClient Multipart| OCR_SVC
    GW -->|WebClient Audio Stream| TTS_SVC
    PY_AI --> TTS_SVC
```

---

## 🔄 End-to-End User Workflows

### 1. Patient Consultation & Multilingual Voice Flow
```mermaid
sequenceDiagram
    autonumber
    actor Patient as 👤 Patient / Doctor
    participant UI as 🖥️ Vite Frontend
    participant Java as ⚙️ Spring Boot (:8080)
    participant AI as 🧠 FastAPI AI (:8000)
    participant TTS as 🔊 Native Indian TTS

    Patient->>UI: Speaks symptoms in Marathi / Hindi / Regional Language
    UI->>Java: POST /api/risk/analyze-symptom-text (Language, Symptoms)
    Java->>AI: Analyze symptoms + check emergency red-flags
    AI-->>Java: Response (OTC guidance, precautions, emergency flag)
    Java-->>UI: Complete Consultation JSON
    UI->>Java: GET /api/tts?lang=mr&text=...
    Java->>TTS: Stream chunked native MP3 audio
    TTS-->>Java: audio/mpeg
    Java-->>UI: Play native voice consultation to user
    UI-->>Patient: 👨‍⚕️ "AI Doctor speaks consultation in native regional voice"
```

### 2. Lab Report & Card OCR Extraction Flow
```mermaid
sequenceDiagram
    autonumber
    actor Clinician as 🩺 Doctor / Health Worker
    participant UI as 🖥️ Frontend
    participant Gateway as ⚙️ Spring Boot Gateway
    participant OCR as 🔍 OCR Microservice (:8001)
    participant Engine as 📋 Flagging Engine

    Clinician->>UI: Uploads Card or Lab Report (JPG/PNG/PDF)
    UI->>Gateway: POST /api/ayushman/extract-public or /api/reports/upload
    Gateway->>OCR: Forward image stream
    OCR->>OCR: Grayscale -> Autocontrast -> Sharpen -> Tesseract
    OCR-->>Gateway: Extracted fields (ABHA ID, Name, Test Values)
    Gateway->>Engine: Compare against standard biological reference ranges
    Engine-->>Gateway: Low / Normal / High / Critical flags
    Gateway-->>UI: Structured clinical report with flags & explanation
    UI-->>Clinician: Ready for clinical review & patient case record
```

---

## ✨ Core Features

### 1. 👨‍⚕️ Multilingual AI Doctor Voice Consultation
- **12 Supported Languages**:
  - `hi` — हिंदी (Hindi)
  - `mr` — मराठी (Marathi)
  - `gu` — ગુજરાતી (Gujarati)
  - `bn` — বাংলা (Bengali)
  - `ta` — தமிழ் (Tamil)
  - `te` — తెలుగు (Telugu)
  - `kn` — ಕನ್ನಡ (Kannada)
  - `ml` — മലയാളം (Malayalam)
  - `pa` — ਪੰਜਾਬੀ (Punjabi)
  - `ur` — اردو (Urdu)
  - `en` — English
  - `or` — ଓଡ଼ିଆ (Odia)
- **High-Fidelity Audio Streaming**: Server-side chunked MP3 audio generation using native pronunciation.
- **Natural Playback Controls**: Calm pace (0.85x), Normal (0.92x), Standard (1.0x) with Play / Pause / Resume / Stop capabilities.
- **Smart Fallback**: Seamless fallback to Web Speech API if offline.

### 2. 🚨 Critical Emergency Detection & Alarm
- Real-time screening for acute symptoms (e.g. chest pain, radiating left arm pain, severe breathlessness, hemoptysis).
- Visual pulsing red alert banner + loud auditory alert spoken in the patient's native tongue.
- Immediate 108 Emergency ambulance advice.

### 3. 📄 Automated Lab Report Processing
- Supports CBC, Lipid Panel, Diabetic Panels (HbA1c, Fasting Glucose), Renal Function (Creatinine, Urea), and Liver Function.
- Strict rule-based flagging prevents hallucinated reference ranges.
- Safe, non-prescriptive, jargon-free explanations in simple Hindi, Marathi, or English.

### 4. 💳 Ayushman Bharat & Aadhaar Verification Assistance
- Automatic field extraction: PM-JAY Card ID, ABHA Number, Beneficiary Name, Gender, DOB, and masked Aadhaar format.
- Pre-populates registration forms in 1 click, eliminating manual typing errors in rural/semi-urban clinics.

---

## 📂 Repository Structure

```
AI_HEALTH_CARE-main/
├── frontend/                        # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/              # SymptomVoiceAnalyzer, Navbar, Sidebar
│   │   ├── pages/                   # HealthRiskAssessment, AyushmanScanner, AadhaarScanner
│   │   ├── services/                # Axios API services (riskService, authService, etc.)
│   │   └── index.css                # Tailwind CSS design system
│   ├── package.json
│   └── vite.config.js
├── backend-java/                    # Core Spring Boot backend
│   ├── src/main/java/com/medicase/
│   │   ├── client/                  # AiServiceClient, AyushmanOcrClient
│   │   ├── controller/              # Auth, Case, Patient, Risk, Tts, Ayushman, Aadhaar
│   │   ├── entity/                  # JPA Models (User, Patient, MedicalReport, Case)
│   │   ├── repository/              # Spring Data JPA repositories
│   │   └── security/                # JWT Filter & SecurityConfig
│   ├── src/main/resources/          # application.yml, Flyway migrations
│   └── pom.xml
├── backend-python/                  # FastAPI AI & Clinical Intelligence Service
│   ├── app/
│   │   ├── api/                     # health, report, risk, summary, translation, tts
│   │   ├── core/                    # config, knowledge base (synonyms, prompts)
│   │   ├── schemas/                 # Pydantic validation models
│   │   └── services/                # extraction_service, flag_engine, risk_engine
│   ├── requirements.txt
│   └── run.py
├── ayushman_login_system/           # Dedicated Card OCR Service
│   ├── app.py                       # Preprocessing & Tesseract OCR pipeline
│   ├── models/                      # ML field classifier
│   └── run.py
├── database/                        # PostgreSQL local data directory
├── start-all.bat                    # Windows 1-click startup script for all 5 services
├── stop-all.bat                     # Windows 1-click shutdown script
├── docker-compose.yml               # Production container deployment
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

| Tool | Recommended Version |
|------|--------------------|
| **Java JDK** | 17 or 21+ |
| **Python** | 3.10, 3.11, or 3.12 |
| **Node.js** | 18+ and npm |
| **PostgreSQL** | 15+ |
| **Tesseract OCR** | 5.0+ with Hindi/Devanagari traineddata |

---

### Option A: One-Click Launch (Windows)

All five services (PostgreSQL, FastAPI AI, Ayushman OCR, Spring Boot Backend, Vite Frontend) can be started together with a single script:

```bat
start-all.bat
```

To gracefully shut down all background services:
```bat
stop-all.bat
```

---

### Option B: Manual Step-by-Step Setup

#### 1. Setup PostgreSQL Database
```sql
CREATE DATABASE medicase;
CREATE USER medicase WITH PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE medicase TO medicase;
```

#### 2. Start the FastAPI AI Service (Port 8000)
```bash
cd backend-python
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```
*Health Check: `http://localhost:8000/health`*

#### 3. Start the Ayushman OCR Service (Port 8001)
```bash
cd ayushman_login_system
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```
*Health Check: `http://127.0.0.1:8001/health`*

#### 4. Start the Spring Boot Backend (Port 8080)
```bash
cd backend-java
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# On Windows: .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```
*Health Check: `http://localhost:8080/actuator/health`*

#### 5. Start the Vite Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Access Application: `http://localhost:5173`*

---

### Option C: Run with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

---

## 🌐 Port & Service Mapping

| Service | Port | Endpoint URL | Description |
|---------|------|--------------|-------------|
| **Frontend UI** | `5173` | `http://localhost:5173` | Vite + React Web Application |
| **Spring Boot Backend** | `8080` | `http://localhost:8080/api` | Central Authentication & Gateway API |
| **AI Intelligence Service** | `8000` | `http://localhost:8000` | Lab analysis, risk engine & TTS streaming |
| **Card OCR Service** | `8001` | `http://127.0.0.1:8001` | Tesseract Ayushman/Aadhaar image parser |
| **PostgreSQL Database** | `5432` | `localhost:5432` | Relational clinical database |

---

## 🔒 Security & Data Privacy

- **Stateless JWT Authentication**: Passwords hashed using standard `BCryptPasswordEncoder`.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `DOCTOR`, `PATIENT`, `ADMIN`, and `RESEARCHER`.
- **Internal Service Isolation**: Direct access to AI microservices is guarded by cryptographic `X-API-KEY` checks.
- **Patient Privacy**: PII and Aadhaar numbers are masked; raw biometric data is never stored.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
