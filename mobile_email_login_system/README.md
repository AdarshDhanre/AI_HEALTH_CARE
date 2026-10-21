# Mobile Number / Email Login System

This is the dedicated feature folder for patient sign-in/registration using a mobile number
or email address with OTP verification. Both contact methods are kept together in this one
folder, as requested.

## Folder structure

- `frontend/RegisterPatient.jsx` — patient registration UI containing the mobile/email selector,
  Send OTP, Verify OTP, and registration-success message.
- `frontend/verificationService.js` — frontend calls for requesting and verifying OTP.
- `backend-java/OtpController.java` — OTP API endpoints.
- `backend-java/OtpVerificationService.java` — OTP generation, expiry, attempt limits, and
  development delivery fallback.
- `backend-java/PatientService.java` — patient registration service.

## Active application integration

The runnable application continues to use the original files in:
- `frontend/src/pages/RegisterPatient.jsx`
- `frontend/src/services/verificationService.js`
- `backend-java/src/main/java/com/medicase/controller/OtpController.java`
- `backend-java/src/main/java/com/medicase/service/OtpVerificationService.java`

The copies in this folder are organized feature sources/reference files; edit the active paths
above if you want changes to immediately affect the running application.

## Run the full project

From the project root, start the existing PostgreSQL database, Python backend, Java backend,
and React frontend according to the root README. Start the frontend with `npm run dev` from
`frontend/`.

## OTP delivery

- Email delivery requires SMTP environment settings in the Java backend.
- Mobile SMS delivery needs a configured SMS gateway. Without a provider, local development
  OTPs are logged in the Java backend console.
- Do not use development OTP logging in production.
