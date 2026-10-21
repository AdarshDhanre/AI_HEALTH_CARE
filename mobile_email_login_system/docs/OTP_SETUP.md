# OTP delivery setup

Email delivery requires Spring Mail configuration in the Java backend environment:
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT` (often 587)
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true`
- `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true`

Without SMTP, OTP is logged to the Java backend console for local development. Mobile SMS delivery currently uses a development-console fallback; configure a compliant SMS provider before production deployment. OTPs expire after five minutes and allow up to five attempts. Do not deploy console OTP fallback to production.
