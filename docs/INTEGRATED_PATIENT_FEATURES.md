# Integrated patient identity, OTP and report PDF features

This update preserves the existing MediCase-AI app and adds:
- Patient registration cards for the existing Ayushman Bharat scanner, an optional Aadhaar reference (last four digits only; not stored), and mobile/email OTP verification.
- OTP request/verification API: `POST /api/verification/send-otp` and `POST /api/verification/verify-otp`.
- Patient email storage through Flyway migration `V2__patient_contact_email.sql`.
- Registration success confirmation.
- `Download Summary PDF` on report review. It opens the browser print dialog; choose **Save as PDF**.

## OTP delivery setup

Email OTP delivery uses Spring Mail when SMTP is configured. Set standard Spring Boot environment properties before running the Java backend:
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT` (commonly 587)
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true`
- `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true`

Without SMTP configuration, the backend logs the OTP to the Java backend console for local development. **Do not deploy this development fallback to production.** Mobile OTP delivery currently logs a development OTP; integrate an SMS provider (for example, a compliant local SMS gateway) before production use. The API never returns the OTP to the browser. Codes expire after five minutes and allow at most five attempts.

## Aadhaar privacy

The Aadhaar field intentionally accepts only the last four digits, is not stored, and is not verified against UIDAI. Real Aadhaar authentication/verification must use an authorized, compliant integration. Do not collect or store a full Aadhaar number or card image unless the application has a lawful basis, required consent, and appropriate safeguards.

## Run / test

1. Start PostgreSQL and the existing backends as usual.
2. Start the Java backend; Flyway applies the new nullable email column automatically.
3. Start the frontend (`npm install`, then `npm run dev`).
4. Open **Register Patient**, choose mobile or email, request an OTP, and in local development check the Java backend console if no delivery provider is configured.
5. Open an analyzed report and choose **Download Summary PDF**, then choose **Save as PDF** in the print dialog.


## Registration flow update
Patient registration can now be completed by filling the patient information form without mobile/email OTP verification. The registration screen shows only two optional card shortcuts: Ayushman Bharat Card and Aadhaar Card. The mobile/email feature folder and backend OTP files are retained for reference, but are not required by the registration form.
