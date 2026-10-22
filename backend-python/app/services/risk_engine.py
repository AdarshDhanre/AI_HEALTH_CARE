"""Age-Based Health Risk Assessment Engine.
Provides rule-based scoring (IDRS, CVD, Hypertension, Kidney, Metabolic) with dual-mode (<45 and 45+)
and multilingual LLM (Gemini) plain-language explanations.
"""

import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.kb import prompt
from app.schemas.risk_schema import (
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    ConditionRisk,
    SymptomTextAnalysisRequest,
    SymptomTextAnalysisResponse,
)

log = logging.getLogger(__name__)


def calculate_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> tuple[Optional[float], Optional[str]]:
    if not weight_kg or not height_cm or height_cm <= 0:
        return None, None
    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 1)
    
    # Asian Indian BMI categories (WHO / Health Ministry)
    if bmi < 18.5:
        category = "UNDERWEIGHT"
    elif bmi < 23.0:
        category = "NORMAL"
    elif bmi < 25.0:
        category = "OVERWEIGHT"
    else:
        category = "OBESE"
    return bmi, category


def check_emergency(req: RiskAssessmentRequest) -> tuple[bool, Optional[str]]:
    symptoms = set(req.symptoms or [])
    
    # Red Flag 1: Chest pain with autonomic symptoms
    if "chest_pain" in symptoms and (
        "excessive_sweating" in symptoms
        or "severe_shortness_of_breath" in symptoms
        or "dizziness" in symptoms
    ):
        return True, (
            "EMERGENCY RED FLAG: Chest pain accompanied by sweating, breathlessness, or dizziness "
            "requires immediate medical evaluation. Please go to the nearest emergency department right away."
        )

    # Red Flag 2: Severe sudden shortness of breath
    if "severe_shortness_of_breath" in symptoms and "chest_pain" in symptoms:
        return True, (
            "EMERGENCY RED FLAG: Severe respiratory distress and chest discomfort require urgent hospital care."
        )

    # Red Flag 3: Hypertensive crisis
    if (req.systolic_bp and req.systolic_bp >= 180) or (req.diastolic_bp and req.diastolic_bp >= 120):
        return True, (
            "HYPERTENSIVE CRISIS WARNING: Blood pressure is dangerously elevated (>= 180/120 mmHg). "
            "Seek urgent medical attention immediately."
        )

    return False, None


def evaluate_45_and_above(req: RiskAssessmentRequest, bmi: Optional[float], bmi_cat: Optional[str]) -> List[ConditionRisk]:
    risks: List[ConditionRisk] = []
    symptoms = set(req.symptoms or [])

    # 1. Diabetes Risk via Indian Diabetes Risk Score (IDRS)
    idrs_score = 0
    idrs_reasons = []

    # Age points: <35: 0, 35-49: 20, >=50: 30
    if req.age >= 50:
        idrs_score += 30
        idrs_reasons.append("Age >= 50 years (+30 pts)")
    elif req.age >= 35:
        idrs_score += 20
        idrs_reasons.append("Age 35-49 years (+20 pts)")

    # Waist / BMI points
    if req.waist_cm:
        if (req.gender == "MALE" and req.waist_cm >= 90) or (req.gender == "FEMALE" and req.waist_cm >= 80):
            idrs_score += 20
            idrs_reasons.append(f"High abdominal waist circumference {req.waist_cm} cm (+20 pts)")
        elif (req.gender == "MALE" and req.waist_cm >= 80) or (req.gender == "FEMALE" and req.waist_cm >= 72):
            idrs_score += 10
            idrs_reasons.append(f"Borderline abdominal waist circumference {req.waist_cm} cm (+10 pts)")
    elif bmi:
        if bmi >= 25.0:
            idrs_score += 20
            idrs_reasons.append(f"BMI {bmi} (Obese for South Asians) (+20 pts)")
        elif bmi >= 23.0:
            idrs_score += 10
            idrs_reasons.append(f"BMI {bmi} (Overweight for South Asians) (+10 pts)")

    # Physical activity
    if req.physical_activity == "SEDENTARY":
        idrs_score += 30
        idrs_reasons.append("Sedentary lifestyle / No regular physical exercise (+30 pts)")
    elif req.physical_activity == "MODERATE":
        idrs_score += 10
        idrs_reasons.append("Moderate daily physical activity (+10 pts)")

    # Family history
    if req.family_history_diabetes == "BOTH_PARENTS":
        idrs_score += 20
        idrs_reasons.append("Both parents have history of diabetes (+20 pts)")
    elif req.family_history_diabetes == "ONE_PARENT":
        idrs_score += 10
        idrs_reasons.append("One parent has history of diabetes (+10 pts)")

    # Lab value overrides
    diab_recs = ["HbA1c test and Fasting Blood Sugar test", "Reduce refined carbohydrates and sugars", "30-45 minutes brisk walking daily"]
    if req.fasting_glucose and req.fasting_glucose >= 126:
        diab_risk = "HIGH"
        idrs_reasons.append(f"Fasting blood sugar is in diabetic range ({req.fasting_glucose} mg/dL)")
    elif req.hba1c and req.hba1c >= 6.5:
        diab_risk = "HIGH"
        idrs_reasons.append(f"HbA1c is in diabetic range ({req.hba1c}%)")
    elif req.fasting_glucose and req.fasting_glucose >= 100:
        diab_risk = "HIGH" if idrs_score >= 50 else "MODERATE"
        idrs_reasons.append(f"Fasting blood sugar indicates pre-diabetes ({req.fasting_glucose} mg/dL)")
    elif req.hba1c and req.hba1c >= 5.7:
        diab_risk = "HIGH" if idrs_score >= 50 else "MODERATE"
        idrs_reasons.append(f"HbA1c indicates pre-diabetes ({req.hba1c}%)")
    elif idrs_score >= 60:
        diab_risk = "HIGH"
    elif idrs_score >= 30:
        diab_risk = "MODERATE"
    else:
        diab_risk = "LOW"

    if "excessive_thirst" in symptoms or "frequent_urination" in symptoms:
        idrs_reasons.append("Symptoms of frequent thirst or urination reported")

    risks.append(ConditionRisk(
        condition="Type 2 Diabetes (IDRS Score)",
        risk_level=diab_risk,
        score=float(idrs_score),
        max_score=100.0,
        reasons=idrs_reasons or ["Standard risk profile"],
        recommendations=diab_recs,
    ))

    # 2. Cardiovascular / Heart Disease Risk
    cvd_score = 0
    cvd_reasons = []
    if req.age >= 55:
        cvd_score += 15
        cvd_reasons.append("Age >= 55")
    if req.smoking_status == "CURRENT":
        cvd_score += 25
        cvd_reasons.append("Active tobacco smoking (major cardiovascular risk factor)")
    elif req.smoking_status == "FORMER":
        cvd_score += 10
        cvd_reasons.append("Former smoker")

    if req.family_history_heart_disease:
        cvd_score += 20
        cvd_reasons.append("Family history of premature heart disease / stroke")

    if req.total_cholesterol:
        if req.total_cholesterol >= 240:
            cvd_score += 25
            cvd_reasons.append(f"High total cholesterol ({req.total_cholesterol} mg/dL)")
        elif req.total_cholesterol >= 200:
            cvd_score += 15
            cvd_reasons.append(f"Borderline high cholesterol ({req.total_cholesterol} mg/dL)")

    if req.systolic_bp and req.systolic_bp >= 140:
        cvd_score += 20
        cvd_reasons.append(f"High systolic blood pressure ({req.systolic_bp} mmHg)")

    if "chest_pain" in symptoms or "mild_breathlessness" in symptoms:
        cvd_score += 20
        cvd_reasons.append("Chest discomfort or exertion breathlessness reported")

    cvd_level = "HIGH" if cvd_score >= 50 else ("MODERATE" if cvd_score >= 25 else "LOW")
    risks.append(ConditionRisk(
        condition="Cardiovascular & Heart Health",
        risk_level=cvd_level,
        score=float(cvd_score),
        max_score=100.0,
        reasons=cvd_reasons or ["No major cardiovascular risk factors noted"],
        recommendations=[
            "Lipid Profile blood test (Total Cholesterol, HDL, LDL, Triglycerides)",
            "Resting ECG and Cardiology consultation if exertion symptoms exist",
            "Heart-healthy low-sodium, low-saturated fat diet",
            "Smoking cessation support if smoking",
        ],
    ))

    # 3. Hypertension Risk
    bp_reasons = []
    bp_level = "LOW"
    sbp = req.systolic_bp
    dbp = req.diastolic_bp
    if sbp and dbp:
        if sbp >= 140 or dbp >= 90:
            bp_level = "HIGH"
            bp_reasons.append(f"Blood pressure {sbp}/{dbp} mmHg is in Stage 2 Hypertension range")
        elif sbp >= 130 or dbp >= 80:
            bp_level = "MODERATE"
            bp_reasons.append(f"Blood pressure {sbp}/{dbp} mmHg is in Stage 1 Hypertension range")
        elif sbp >= 120 and dbp < 80:
            bp_level = "MODERATE"
            bp_reasons.append(f"Systolic BP {sbp} mmHg is in elevated range")
        else:
            bp_reasons.append(f"Blood pressure {sbp}/{dbp} mmHg is in healthy reference range")
    elif req.age >= 50:
        bp_level = "MODERATE"
        bp_reasons.append("Age >= 50 requires regular periodic blood pressure screening")

    risks.append(ConditionRisk(
        condition="Hypertension (Blood Pressure)",
        risk_level=bp_level,
        reasons=bp_reasons or ["Check BP periodically"],
        recommendations=[
            "Daily blood pressure monitoring log for 7 days",
            "Limit dietary sodium (table salt, pickles, papad, processed snacks)",
            "Maintain adequate hydration and stress relaxation techniques",
        ],
    ))

    # 4. Kidney Function Risk
    kidney_reasons = []
    kidney_score = 0
    if "leg_swelling" in symptoms:
        kidney_score += 30
        kidney_reasons.append("Leg/ankle swelling (peripheral edema) reported")
    if sbp and sbp >= 140:
        kidney_score += 20
        kidney_reasons.append("Uncontrolled blood pressure increases renal filtration load")
    if req.fasting_glucose and req.fasting_glucose >= 126:
        kidney_score += 25
        kidney_reasons.append("Elevated blood glucose is a primary risk factor for diabetic nephropathy")

    kidney_level = "HIGH" if kidney_score >= 50 else ("MODERATE" if kidney_score >= 25 else "LOW")
    risks.append(ConditionRisk(
        condition="Kidney & Renal Health",
        risk_level=kidney_level,
        reasons=kidney_reasons or ["Normal renal risk indicators"],
        recommendations=[
            "Serum Creatinine and Blood Urea Nitrogen (BUN) test",
            "Urine Routine & Microalbumin-to-Creatinine ratio",
            "Stay well hydrated with clean water",
        ],
    ))

    # 5. Joint & Bone Health
    if "joint_pain" in symptoms or req.age >= 60:
        bone_level = "MODERATE" if req.age < 60 else "HIGH"
        risks.append(ConditionRisk(
            condition="Joint & Bone Health (Arthritis/Osteopenia)",
            risk_level=bone_level,
            reasons=["Joint discomfort reported" if "joint_pain" in symptoms else "Age >= 60 increased bone demineralization risk"],
            recommendations=[
                "Serum Calcium and 25-Hydroxy Vitamin D test",
                "Weight-bearing mild exercise and knee-strengthening physiotherapy",
            ],
        ))

    return risks


def evaluate_under_45(req: RiskAssessmentRequest, bmi: Optional[float], bmi_cat: Optional[str]) -> List[ConditionRisk]:
    risks: List[ConditionRisk] = []
    symptoms = set(req.symptoms or [])

    # 1. Anemia & Micronutrient Deficiency Risk
    anemia_score = 0
    anemia_reasons = []
    if "fatigue" in symptoms:
        anemia_score += 25
        anemia_reasons.append("Persistent tiredness and low energy reported")
    if "dizziness" in symptoms:
        anemia_score += 20
        anemia_reasons.append("Occasional dizziness or lightheadedness")
    if req.pure_vegetarian_diet:
        anemia_score += 25
        anemia_reasons.append("Strict vegetarian diet without routine Vitamin B12 or D3 supplementation")
    if req.gender == "FEMALE":
        anemia_score += 15
        anemia_reasons.append("Reproductive age group female (monthly physiological blood loss)")

    anemia_level = "HIGH" if anemia_score >= 50 else ("MODERATE" if anemia_score >= 25 else "LOW")
    risks.append(ConditionRisk(
        condition="Anemia & Micronutrient Deficiency (Iron, B12, D3)",
        risk_level=anemia_level,
        score=float(anemia_score),
        max_score=100.0,
        reasons=anemia_reasons or ["No notable nutritional deficiency indicators"],
        recommendations=[
            "Complete Blood Count (CBC) with Hemoglobin, MCV, Ferritin",
            "Serum Vitamin B12 and Vitamin D3 (25-OH) levels",
            "Include iron-rich foods (spinach, jaggery, beetroot, legumes) and citrus fruits (Vitamin C)",
        ],
    ))

    # 2. PCOS & Hormonal Imbalance (Females)
    if req.gender == "FEMALE":
        pcos_score = 0
        pcos_reasons = []
        if req.has_irregular_periods:
            pcos_score += 45
            pcos_reasons.append("Menstrual cycle irregularity or missed cycles reported")
        if bmi and bmi >= 23.0:
            pcos_score += 25
            pcos_reasons.append(f"Elevated BMI {bmi} (insulin resistance contributor)")
        if req.high_stress:
            pcos_score += 15
            pcos_reasons.append("Chronic stress elevates cortisol and disrupts hormonal balance")

        pcos_level = "HIGH" if pcos_score >= 50 else ("MODERATE" if pcos_score >= 30 else "LOW")
        risks.append(ConditionRisk(
            condition="PCOS & Hormonal Imbalance",
            risk_level=pcos_level,
            score=float(pcos_score),
            max_score=100.0,
            reasons=pcos_reasons or ["Regular cycles and normal metabolic indicators"],
            recommendations=[
                "Pelvic Ultrasound (USG) for follicular assessment",
                "Fasting Insulin, Thyroid Profile (TSH), LH/FSH ratio",
                "Balanced low-glycemic index meals with regular physical workouts",
            ],
        ))

    # 3. Early Metabolic & Insulin Resistance Risk
    metabolic_score = 0
    metabolic_reasons = []
    if bmi and bmi >= 25.0:
        metabolic_score += 35
        metabolic_reasons.append(f"BMI {bmi} is in obesity range for South Asians")
    elif bmi and bmi >= 23.0:
        metabolic_score += 20
        metabolic_reasons.append(f"BMI {bmi} is in overweight range for South Asians")

    if req.family_history_diabetes in ("ONE_PARENT", "BOTH_PARENTS"):
        metabolic_score += 25
        metabolic_reasons.append("Genetic predisposition: Family history of diabetes")

    if req.physical_activity == "SEDENTARY":
        metabolic_score += 20
        metabolic_reasons.append("Sedentary desk lifestyle with minimal physical exertion")

    metabolic_level = "HIGH" if metabolic_score >= 50 else ("MODERATE" if metabolic_score >= 25 else "LOW")
    risks.append(ConditionRisk(
        condition="Metabolic Syndrome & Early Prediabetes",
        risk_level=metabolic_level,
        score=float(metabolic_score),
        max_score=100.0,
        reasons=metabolic_reasons or ["Healthy metabolic baseline"],
        recommendations=[
            "Fasting Blood Sugar and HbA1c screening",
            "150 minutes of aerobic activity per week (running, cycling, swimming, brisk walking)",
            "Replace sugary beverages and refined carbs with whole grains and protein",
        ],
    ))

    # 4. Lifestyle Burnout, Screen Strain & Sleep Debt
    burnout_score = 0
    burnout_reasons = []
    if req.daily_screen_time_hours and req.daily_screen_time_hours >= 9:
        burnout_score += 25
        burnout_reasons.append(f"High digital screen time: {req.daily_screen_time_hours} hours/day")
    if req.sleep_hours_per_night and req.sleep_hours_per_night < 6.5:
        burnout_score += 30
        burnout_reasons.append(f"Insufficient sleep: {req.sleep_hours_per_night} hours/night (restorative minimum is 7-8 hrs)")
    if req.high_stress:
        burnout_score += 25
        burnout_reasons.append("Self-reported chronic mental or workplace stress")

    burnout_level = "HIGH" if burnout_score >= 50 else ("MODERATE" if burnout_score >= 25 else "LOW")
    risks.append(ConditionRisk(
        condition="Lifestyle Stress, Sleep Debt & Digital Fatigue",
        risk_level=burnout_level,
        score=float(burnout_score),
        max_score=100.0,
        reasons=burnout_reasons or ["Good sleep and balanced daily routine"],
        recommendations=[
            "Prioritize 7 to 8 hours of consistent, uninterrupted sleep",
            "Follow the 20-20-20 rule for screens (every 20 mins look 20 ft away for 20 secs)",
            "Incorporate daily 15-minute mindfulness or pranayama / deep breathing",
        ],
    ))

    return risks


def build_ai_explanation(
    mode: str,
    age: int,
    gender: str,
    bmi: Optional[float],
    bmi_cat: Optional[str],
    risks: List[ConditionRisk],
    is_emergency: bool,
    emergency_msg: Optional[str],
    lang: str,
) -> str:
    # Prepare summary facts for LLM prompt
    risk_summaries = [f"- {r.condition}: {r.risk_level} risk (Reasons: {', '.join(r.reasons)})" for r in risks]
    facts = f"""
Patient Profile:
- Age: {age} years, Gender: {gender}
- Mode: {mode}
- BMI: {bmi or 'Not measured'} ({bmi_cat or 'N/A'})
- Emergency Status: {'CRITICAL EMERGENCY' if is_emergency else 'NON-EMERGENCY'}
{f'- Emergency Message: {emergency_msg}' if emergency_msg else ''}

Identified Risk Levels:
{chr(10).join(risk_summaries)}
"""
    if settings.llm_provider == "none":
        # Fallback template
        if is_emergency:
            return emergency_msg or "Emergency attention required."
        top_risks = [r for r in risks if r.risk_level in ("HIGH", "CRITICAL")]
        if top_risks:
            names = ", ".join([r.condition for r in top_risks])
            return f"Your preventive assessment indicates elevated risk for: {names}. We strongly suggest discussing these findings with your healthcare doctor for preventive lab testing."
        return "Your overall preventive health parameters appear mostly within moderate to low risk ranges. Continue healthy dietary habits and routine annual checkups."

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.llm_api_key or "none", base_url=settings.llm_base_url or None)
        lang_names = {"en": "English", "hi": "Hindi (हिंदी)", "mr": "Marathi (मराठी)"}
        sys_prompt = prompt("risk_prompt.txt").replace("{language}", lang_names.get(lang, "English"))
        
        resp = client.chat.completions.create(
            model=settings.llm_model,
            temperature=0.3,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": facts.strip()},
            ],
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        log.warning("Gemini risk explanation failed: %s", e)
        return (
            "Your preventive assessment has been calculated. Please review the detailed risk scores below "
            "and consult your doctor for personalized clinical evaluation."
        )


def assess_health_risk(req: RiskAssessmentRequest) -> RiskAssessmentResponse:
    bmi, bmi_cat = calculate_bmi(req.weight_kg, req.height_cm)
    is_emergency, emergency_msg = check_emergency(req)
    
    mode = "45_AND_ABOVE" if req.age >= 45 else "UNDER_45"
    
    if mode == "45_AND_ABOVE":
        risks = evaluate_45_and_above(req, bmi, bmi_cat)
        recommended_tests = [
            "Fasting Blood Glucose & HbA1c (Glycemic control)",
            "Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)",
            "Blood Pressure monitoring (morning and evening for 7 days)",
            "Kidney Function Test (Serum Creatinine & Electrolytes)",
            "Resting ECG (Electrocardiogram)",
        ]
        lifestyle_precautions = [
            "Reduce dietary salt (< 5g per day) and limit processed snacks/pickles",
            "Engage in at least 30 minutes of moderate aerobic activity (e.g. brisk walking) 5 days a week",
            "Incorporate high-fiber vegetables, pulses, and whole grains while reducing refined sugars",
            "Avoid active tobacco smoking and minimize alcohol consumption",
            "Monitor blood pressure and blood sugar regularly at home",
        ]
        when_to_see_doctor = [
            "Immediately if experiencing sudden chest pain, shortness of breath, dizziness, or profuse sweating",
            "Within 1-2 weeks if blood pressure exceeds 140/90 mmHg or fasting sugar is above 126 mg/dL",
            "If noticeable swelling in ankles/feet, persistent unusual fatigue, or vision changes occur",
        ]
    else:
        risks = evaluate_under_45(req, bmi, bmi_cat)
        recommended_tests = [
            "Complete Blood Count (CBC) with Hemoglobin & Erythrocyte Indices",
            "Serum Vitamin B12 and 25-OH Vitamin D3",
            "Fasting Blood Sugar & Thyroid Profile (TSH)",
        ]
        if req.gender == "FEMALE":
            recommended_tests.append("Pelvic Ultrasound & Hormonal evaluation if cycles are irregular")
        lifestyle_precautions = [
            "Ensure 7-8 hours of regular, restorative sleep every night",
            "Take frequent 2-minute visual breaks from screens during long work hours (20-20-20 rule)",
            "Maintain adequate hydration (2.5 to 3 liters of water daily)",
            "If following a strict vegetarian diet, discuss Vitamin B12 and D3 supplementation with a doctor",
            "Practice daily stress-reduction techniques like pranayama, yoga, or brief evening walks",
        ]
        when_to_see_doctor = [
            "If severe fatigue, dizziness, or recurring menstrual irregularity interferes with daily routine",
            "If rapid unexplained weight changes, chronic digestive issues, or persistent joint aches appear",
            "For routine annual wellness checkup and personalized dietary guidance",
        ]

    # Calculate overall risk level
    if is_emergency:
        overall_level = "CRITICAL"
    elif any(r.risk_level == "HIGH" for r in risks):
        overall_level = "HIGH"
    elif any(r.risk_level == "MODERATE" for r in risks):
        overall_level = "MODERATE"
    else:
        overall_level = "LOW"

    ai_exp = build_ai_explanation(
        mode=mode,
        age=req.age,
        gender=req.gender,
        bmi=bmi,
        bmi_cat=bmi_cat,
        risks=risks,
        is_emergency=is_emergency,
        emergency_msg=emergency_msg,
        lang=req.language,
    )

    disclaimers = {
        "en": "This assessment is an educational risk estimation based on standard clinical guidelines (IDRS, WHO/ISH). It is NOT a medical diagnosis or treatment prescription. Always consult a qualified physician for clinical care.",
        "hi": "यह आकलन मानक क्लिनिकल दिशानिर्देशों (IDRS, WHO) पर आधारित एक संभावित जोखिम अनुमान है। यह कोई मेडिकल डायग्नोसिस या दवा का पर्चा नहीं है। वास्तविक चिकित्सकीय सलाह के लिए कृपया डॉक्टर से परामर्श करें।",
        "mr": "हे मूल्यांकन मानक क्लिनिकल मार्गदर्शक तत्त्वांवर आधारित एक संभाव्य जोखीम अंदाज आहे. हे कोणतेही वैद्यकीय निदान किंवा औषधोपचार नाही. योग्य वैद्यकीय सल्ल्यासाठी नेहमी डॉक्टरांशी संपर्क साधा.",
    }

    return RiskAssessmentResponse(
        mode=mode,
        age=req.age,
        gender=req.gender,
        bmi=bmi,
        bmi_category=bmi_cat,
        is_emergency=is_emergency,
        emergency_message=emergency_msg,
        overall_risk_level=overall_level,
        risks=risks,
        recommended_tests=recommended_tests,
        lifestyle_precautions=lifestyle_precautions,
        when_to_see_doctor=when_to_see_doctor,
        ai_explanation=ai_exp,
        disclaimer=disclaimers.get(req.language, disclaimers["en"]),
    )


SUPPORTED_INDIAN_LANGUAGES = {
    "hi": "Hindi (हिंदी)",
    "en": "English",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "bn": "Bengali (বাংলা)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "ur": "Urdu (اردو)",
    "or": "Odia (ଓଡ଼ିଆ)",
}


def analyze_freeform_symptoms(req: SymptomTextAnalysisRequest) -> SymptomTextAnalysisResponse:
    text = (req.user_text or "").strip()
    lang = req.language if req.language in SUPPORTED_INDIAN_LANGUAGES else "hi"
    lang_name = SUPPORTED_INDIAN_LANGUAGES.get(lang, "Hindi (हिंदी)")
    
    # 1. Deterministic Rule & Keyword Fallback
    text_lower = text.lower()
    fallback_detected = []
    
    if any(w in text_lower for w in ["chest", "seene", "chhati", "heart", "छाती", "हार्ट"]):
        fallback_detected.append("chest_pain")
    if any(w in text_lower for w in ["sweat", "paseena", "पसीना"]):
        fallback_detected.append("excessive_sweating")
    if any(w in text_lower for w in ["saans phool", "saans lene me", "dam ghut", "breath", "सांस"]):
        if any(w in text_lower for w in ["severe", "bahut", "bohot", "jada", "zyada"]):
            fallback_detected.append("severe_shortness_of_breath")
        else:
            fallback_detected.append("mild_breathlessness")
    if any(w in text_lower for w in ["bukhar", "fever", "taap", "ताप", "बुखार", "गरम"]):
        fallback_detected.append("fever")
    if any(w in text_lower for w in ["pet", "stomach", "gas", "acidity", "ultee", "vomit", "dast", "loose motion", "पेट", "गैस"]):
        fallback_detected.append("stomach_pain_or_upset")
    if any(w in text_lower for w in ["sir dard", "sar dard", "headache", "माथा", "सिर दर्द"]):
        fallback_detected.append("headache")
    if any(w in text_lower for w in ["thak", "kamzor", "fatigue", "tired", "weak", "थकान", "कमजोरी"]):
        fallback_detected.append("fatigue")
    if any(w in text_lower for w in ["pyaas", "thirst", "प्यास"]):
        fallback_detected.append("excessive_thirst")
    if any(w in text_lower for w in ["peshab", "urina", "पेशाब"]):
        fallback_detected.append("frequent_urination")
    if any(w in text_lower for w in ["sujan", "swell", "सूजन"]):
        fallback_detected.append("leg_swelling")
    if any(w in text_lower for w in ["chakkar", "dizz", "चक्कर"]):
        fallback_detected.append("dizziness")
    if any(w in text_lower for w in ["dhundhla", "blur", "nazar", "धुंधला"]):
        fallback_detected.append("blurred_vision")
    if any(w in text_lower for w in ["ghutn", "joint", "कमर", "जोड़ों", "घुटने"]):
        fallback_detected.append("joint_pain")

    # Emergency check
    is_emergency = (
        ("chest_pain" in fallback_detected and ("excessive_sweating" in fallback_detected or "severe_shortness_of_breath" in fallback_detected or "dizziness" in fallback_detected))
        or "severe_shortness_of_breath" in fallback_detected
    )
    emergency_warning = (
        "आपातकालीन चेतावनी (RED FLAG): सीने में दर्द और पसीना/सांस फूलना गंभीर स्थिति हो सकती है। तुरंत नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं!"
        if lang == "hi" else (
            "आणीबाणी चेतावणी (RED FLAG): छातीत दुखणे आणि घाम येणे ही गंभीर स्थिती असू शकते. कृपया तातडीने जवळच्या रुग्णालयात जा!"
            if lang == "mr" else
            "EMERGENCY RED FLAG: Chest discomfort accompanied by cold sweating or breathing distress requires immediate emergency medical evaluation. Go to the nearest emergency room immediately."
        )
    ) if is_emergency else None

    # Fallback OTC medicines based on detected symptoms
    fallback_medicines = []
    if "fever" in fallback_detected or "headache" in fallback_detected:
        fallback_medicines.append({
            "name": "Paracetamol 500mg (Crocin / Calpol)",
            "purpose": "बुखार और बदन दर्द/सिर दर्द को कम करने के लिए" if lang == "hi" else "For reducing fever and body/head pain",
            "dosage_instruction": "खाना खाने के बाद लें, 24 घंटे में 3 बार से ज्यादा न लें" if lang == "hi" else "Take after food, do not exceed 3 times in 24 hours",
            "relief_explanation": "यह मस्तिष्क के तापमान केंद्र को नियंत्रित करके बुखार उतारता है और दर्द से राहत देता है" if lang == "hi" else "Acts on the brain temperature center to lower fever and ease pain"
        })
    if "stomach_pain_or_upset" in fallback_detected:
        fallback_medicines.append({
            "name": "Antacid Liquid / Chewable (Digene / Gelusil)",
            "purpose": "पेट में गैस, एसिडिटी और जलन शांत करने के लिए" if lang == "hi" else "For neutralizing stomach acidity, gas and burning",
            "dosage_instruction": "भोजन के 30 मिनट बाद या दर्द होने पर 1-2 चम्मच लें" if lang == "hi" else "Take 1-2 teaspoons 30 mins after meals or when in pain",
            "relief_explanation": "यह पेट के अतिरिक्त एसिड को बेअसर करता है जिससे पेट का भारीपन व जलन तुरंत कम होती है" if lang == "hi" else "Neutralizes excess stomach acid to soothe lining and burning"
        })
        fallback_medicines.append({
            "name": "ORS (Oral Rehydration Solution) / इलेक्ट्रोलाइट घोल",
            "purpose": "शरीर में पानी और जरूरी लवणों की कमी पूरी करने के लिए" if lang == "hi" else "To prevent dehydration and restore vital body electrolytes",
            "dosage_instruction": "1 लीटर उबले और ठंडे पानी में 1 पैकेट घोलकर दिनभर घूंट-घूंट पिएं" if lang == "hi" else "Dissolve 1 sachet in 1 liter boiled cooled water and sip throughout the day",
            "relief_explanation": "दस्त, उल्टी या बुखार में कमजोरी व चक्कर आने से बचाता है" if lang == "hi" else "Replenishes vital salts and prevents weakness and fainting"
        })

    fallback_precautions = [
        {"category": "DO", "instruction": "पर्याप्त मात्रा में गुनगुना या उबला पानी पिएं और पूरा आराम करें" if lang == "hi" else "Drink adequate boiled/warm water and get sufficient bed rest"},
        {"category": "DONT", "instruction": "तली-भुनी, ज्यादा तीखी चीजें, खट्टे फल और कैफीन/चाय-कॉफी से परहेज करें" if lang == "hi" else "Avoid fried, oily, overly spicy food and excessive caffeine"},
        {"category": "DIET", "instruction": "हल्की मूंग दाल की खिचड़ी, दलिया या सूप का सेवन करें" if lang == "hi" else "Consume easily digestible meals like light khichdi, porridge, or clear soup"}
    ]

    fallback_response_text = (
        f"नमस्ते। आपने बताया कि आपको {text} की परेशानी हो रही है। इस प्रकार की तकलीफ में शरीर को आराम और उचित देखभाल की आवश्यकता होती है। नीचे बताई गई प्राथमिक दवाओं और सावधानियों का पालन करें, और यदि तकलीफ 24-48 घंटों में ठीक न हो तो डॉक्टर को अवश्य दिखाएं।"
        if lang == "hi" else
        f"Hello. Based on your symptoms ({text}), your body needs proper rest, hydration, and gentle care. Please review the first-aid symptomatic medications and precautions below. If symptoms persist beyond 24-48 hours, consult a physician."
    )

    fallback_disclaimer = (
        "यह एक प्राथमिक (First-Aid / OTC) परामर्श है, किसी डॉक्टर की औपचारिक पर्ची (Prescription) नहीं। गंभीर स्थिति में तुरंत डॉक्टर से मिलें।"
        if lang == "hi" else
        "This is an educational primary first-aid recommendation, not a certified clinical prescription. Consult a licensed physician for ongoing or severe symptoms."
    )

    if settings.llm_provider == "none":
        return SymptomTextAnalysisResponse(
            detected_symptoms=fallback_detected or ["general_discomfort"],
            is_emergency=is_emergency,
            emergency_warning=emergency_warning,
            humanized_response=fallback_response_text,
            suggested_medicines=fallback_medicines,
            precautions=fallback_precautions,
            diet_lifestyle_tips=["उबला पानी पिएं", "हल्का खाना खाएं", "आराम करें"],
            recommended_immediate_advice=[
                "आराम करें और तनाव न लें",
                "पर्याप्त मात्रा में पानी पिएं",
                "तकलीफ बढ़ने पर डॉक्टर से परामर्श लें"
            ],
            spoken_summary=fallback_response_text,
            disclaimer=fallback_disclaimer,
        )

    # 2. Gemini 3.8 Flash Humanized Voice & Text Scribe with Medicines & Precautions
    try:
        from openai import OpenAI
        import json
        import re

        client = OpenAI(api_key=settings.llm_api_key or "none", base_url=settings.llm_base_url or None)
        sys_prompt = prompt("voice_symptom_prompt.txt").replace("{language_name}", lang_name).replace("{language_code}", lang)

        user_content = f"Patient Input: \"{text}\"\nPatient Language: {lang_name}\nPatient Context: Age {req.age or 'Not stated'}, Gender {req.gender or 'Not stated'}"

        resp = client.chat.completions.create(
            model=settings.llm_model,
            temperature=0.3,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_content},
            ],
        )

        content = resp.choices[0].message.content.strip()
        clean_json = re.sub(r"^```(?:json)?\s*", "", content, flags=re.MULTILINE)
        clean_json = re.sub(r"\s*```$", "", clean_json, flags=re.MULTILINE).strip()
        data = json.loads(clean_json)

        detected = list(set((data.get("detected_symptoms") or []) + fallback_detected))
        emerg = bool(data.get("is_emergency") or is_emergency)
        warn = data.get("emergency_warning") or emergency_warning

        meds = data.get("suggested_medicines") or fallback_medicines
        prec = data.get("precautions") or fallback_precautions
        diet = data.get("diet_lifestyle_tips") or ["Drink plenty of warm water", "Eat light easily digestible food", "Get adequate rest"]
        imm_advice = data.get("recommended_immediate_advice") or [
            "Rest in a relaxed position",
            "Monitor body temperature and hydration",
            "Consult a doctor if pain or fever does not subside"
        ]
        spoken = data.get("spoken_summary") or data.get("humanized_response") or fallback_response_text
        disc = data.get("disclaimer") or fallback_disclaimer

        return SymptomTextAnalysisResponse(
            detected_symptoms=detected,
            is_emergency=emerg,
            emergency_warning=warn if emerg else None,
            humanized_response=data.get("humanized_response") or fallback_response_text,
            suggested_medicines=meds,
            precautions=prec,
            diet_lifestyle_tips=diet,
            recommended_immediate_advice=imm_advice,
            spoken_summary=spoken,
            disclaimer=disc,
        )
    except Exception as e:
        log.warning("Voice/Text symptom analysis via LLM failed: %s", e)
        return SymptomTextAnalysisResponse(
            detected_symptoms=fallback_detected or ["general_discomfort"],
            is_emergency=is_emergency,
            emergency_warning=emergency_warning,
            humanized_response=fallback_response_text,
            suggested_medicines=fallback_medicines,
            precautions=fallback_precautions,
            diet_lifestyle_tips=["उबला पानी पिएं", "हल्का खाना खाएं", "आराम करें"],
            recommended_immediate_advice=[
                "Rest in a relaxed position",
                "Monitor for any progression of symptoms",
                "Consult a licensed medical doctor"
            ],
            spoken_summary=fallback_response_text,
            disclaimer=fallback_disclaimer,
        )

