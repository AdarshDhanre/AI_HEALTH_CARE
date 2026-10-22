from typing import List, Optional
from pydantic import BaseModel, Field


class RiskAssessmentRequest(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Patient age in years")
    gender: str = Field(..., description="MALE, FEMALE, or OTHER")
    height_cm: Optional[float] = Field(None, ge=50, le=250, description="Height in cm")
    weight_kg: Optional[float] = Field(None, ge=10, le=300, description="Weight in kg")
    waist_cm: Optional[float] = Field(None, ge=40, le=200, description="Waist circumference in cm")
    
    # Blood & Vitals
    systolic_bp: Optional[int] = Field(None, ge=60, le=260, description="Systolic blood pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=40, le=160, description="Diastolic blood pressure (mmHg)")
    fasting_glucose: Optional[float] = Field(None, ge=30, le=600, description="Fasting glucose in mg/dL")
    hba1c: Optional[float] = Field(None, ge=3.0, le=18.0, description="HbA1c percentage")
    total_cholesterol: Optional[float] = Field(None, ge=50, le=600, description="Total cholesterol mg/dL")
    
    # Lifestyle & History
    smoking_status: str = Field("NEVER", description="NEVER, FORMER, or CURRENT")
    alcohol_consumption: str = Field("NONE", description="NONE, OCCASIONAL, or REGULAR")
    physical_activity: str = Field("MODERATE", description="VIGOROUS, MODERATE, or SEDENTARY")
    family_history_diabetes: str = Field("NONE", description="NONE, ONE_PARENT, or BOTH_PARENTS")
    family_history_heart_disease: bool = Field(False, description="Family history of early heart attack or stroke")
    
    # Mode-Specific Parameters
    # < 45 specific
    has_irregular_periods: Optional[bool] = Field(None, description="Female < 45: menstrual irregularities")
    daily_screen_time_hours: Optional[float] = Field(None, ge=0, le=24, description="Hours of screen time per day")
    sleep_hours_per_night: Optional[float] = Field(None, ge=0, le=24, description="Average sleep hours per night")
    high_stress: Optional[bool] = Field(None, description="Chronic stress reported")
    pure_vegetarian_diet: Optional[bool] = Field(None, description="Strict vegetarian without B12/D3 supplements")
    
    # Symptoms checklist
    symptoms: List[str] = Field(default_factory=list, description="List of active symptoms")
    # Supported symptoms:
    # 'chest_pain', 'excessive_sweating', 'severe_shortness_of_breath',
    # 'mild_breathlessness', 'fatigue', 'excessive_thirst',
    # 'frequent_urination', 'leg_swelling', 'blurred_vision',
    # 'joint_pain', 'dizziness'

    # Language for LLM explanation
    language: str = Field("en", description="en, hi, or mr")


class ConditionRisk(BaseModel):
    condition: str
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    score: Optional[float] = None
    max_score: Optional[float] = None
    reasons: List[str]
    recommendations: List[str]


class RiskAssessmentResponse(BaseModel):
    mode: str  # "UNDER_45" or "45_AND_ABOVE"
    age: int
    gender: str
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    
    is_emergency: bool = False
    emergency_message: Optional[str] = None
    
    overall_risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    risks: List[ConditionRisk]
    
    recommended_tests: List[str]
    lifestyle_precautions: List[str]
    when_to_see_doctor: List[str]
    
    ai_explanation: str
    disclaimer: str


class SuggestedMedicine(BaseModel):
    name: str = Field(..., description="Medicine generic and common OTC brand name")
    purpose: str = Field(..., description="What symptom this medicine treats")
    dosage_instruction: str = Field(..., description="When and how to safely take it")
    relief_explanation: str = Field(..., description="How this medicine provides relief to the patient")


class PrecautionGuideline(BaseModel):
    category: str = Field(..., description="DO, DONT, DIET, or MONITORING")
    instruction: str = Field(..., description="Detailed precaution instruction")


class SymptomTextAnalysisRequest(BaseModel):
    user_text: str = Field(..., min_length=2, description="Spoken or typed symptom description")
    language: str = Field("hi", description="Language code: hi, en, mr, gu, bn, ta, te, kn, ml, pa, ur, or")
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None)


class SymptomTextAnalysisResponse(BaseModel):
    detected_symptoms: List[str] = Field(default_factory=list, description="Extracted symptom keys")
    is_emergency: bool = False
    emergency_warning: Optional[str] = None
    humanized_response: str
    suggested_medicines: List[SuggestedMedicine] = Field(default_factory=list)
    precautions: List[PrecautionGuideline] = Field(default_factory=list)
    diet_lifestyle_tips: List[str] = Field(default_factory=list)
    recommended_immediate_advice: List[str] = Field(default_factory=list)
    spoken_summary: Optional[str] = None
    disclaimer: Optional[str] = None
