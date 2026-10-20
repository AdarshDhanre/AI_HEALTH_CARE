CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(20)  NOT NULL,            -- DOCTOR | PATIENT | ADMIN | RESEARCHER
    language      VARCHAR(5)   NOT NULL DEFAULT 'en',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE patients (
    id                 BIGSERIAL PRIMARY KEY,
    patient_uid        VARCHAR(20)  NOT NULL UNIQUE,
    user_id            BIGINT REFERENCES users(id),
    doctor_id          BIGINT REFERENCES users(id),
    name               VARCHAR(150) NOT NULL,
    dob                DATE,
    gender             VARCHAR(10),
    phone              VARCHAR(20),
    diet_pref          VARCHAR(20)  NOT NULL DEFAULT 'VEGETARIAN',   -- VEGETARIAN | NON_VEGETARIAN | VEGAN
    preferred_language VARCHAR(5)   NOT NULL DEFAULT 'en',
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_doctor ON patients(doctor_id);
CREATE INDEX idx_patients_user ON patients(user_id);

CREATE TABLE cases (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       BIGINT REFERENCES users(id),
    chief_complaint TEXT,
    symptoms        TEXT,
    medical_history TEXT,
    lifestyle       TEXT,
    ayush_details   JSONB,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cases_patient ON cases(patient_id);

CREATE TABLE reports (
    id                BIGSERIAL PRIMARY KEY,
    patient_id        BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    uploaded_by       BIGINT REFERENCES users(id),
    file_path         VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    report_date       DATE,
    lab_name          VARCHAR(200),
    status            VARCHAR(20) NOT NULL DEFAULT 'UPLOADED',   -- UPLOADED | PROCESSING | DONE | FAILED
    reviewed          BOOLEAN     NOT NULL DEFAULT FALSE,
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reports_patient ON reports(patient_id, report_date);

CREATE TABLE lab_results (
    id               BIGSERIAL PRIMARY KEY,
    report_id        BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    test_name        VARCHAR(150) NOT NULL,
    raw_name         VARCHAR(200),
    value            DOUBLE PRECISION NOT NULL,
    unit             VARCHAR(40),
    ref_low          DOUBLE PRECISION,        -- reference range printed on THIS lab's report
    ref_high         DOUBLE PRECISION,
    ref_text         VARCHAR(100),
    flag             VARCHAR(15) NOT NULL,    -- NORMAL | LOW | HIGH | CRITICAL | UNKNOWN
    safety_level     VARCHAR(10) NOT NULL,    -- GREEN | YELLOW | RED | GREY
    confidence       DOUBLE PRECISION,
    needs_review     BOOLEAN NOT NULL DEFAULT FALSE,
    edited_by_doctor BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_lab_results_report ON lab_results(report_id);
CREATE INDEX idx_lab_results_test ON lab_results(test_name);

CREATE TABLE ai_summaries (
    id            BIGSERIAL PRIMARY KEY,
    report_id     BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    language      VARCHAR(5) NOT NULL,
    summary_text  TEXT,
    guidance_json JSONB,
    overall_level VARCHAR(10),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (report_id, language)
);

CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT,
    action     VARCHAR(60) NOT NULL,
    entity     VARCHAR(60),
    entity_id  BIGINT,
    details    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
