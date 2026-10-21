# Mobile / Email OTP API

Base path: `/api/verification`

- `POST /send-otp` — request an OTP for the selected channel and destination.
- `POST /verify-otp` — verify the OTP before patient registration.

The frontend currently uses the channel values `mobile` and `email`. Codes expire after
five minutes and have a maximum of five verification attempts. Configure SMTP for real email
delivery and integrate an SMS provider for real mobile delivery.
