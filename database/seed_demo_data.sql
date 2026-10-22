-- Demo patients. Run AFTER registering a doctor through the app (sign up as "Doctor").
-- Replace the e-mail below with that doctor's e-mail.
INSERT INTO patients (patient_uid, doctor_id, name, dob, gender, diet_pref, preferred_language)
SELECT v.uid, u.id, v.name, v.dob::date, v.gender, v.diet, v.lang
FROM users u,
     (VALUES ('MC-DEMO0001', 'Demo Patient One', '1985-04-12', 'Male',   'VEGETARIAN',     'en'),
             ('MC-DEMO0002', 'Demo Patient Two', '1992-09-30', 'Female', 'NON_VEGETARIAN', 'mr')) AS v(uid, name, dob, gender, diet, lang)
WHERE u.email = 'doctor@example.com' AND u.role = 'DOCTOR'
ON CONFLICT (patient_uid) DO NOTHING;
