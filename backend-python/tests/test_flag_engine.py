from app.services.flag_engine import compute_flag


def test_normal_low_high():
    assert compute_flag("Hemoglobin", 15, "g/dL", 13, 17) == "NORMAL"
    assert compute_flag("Hemoglobin", 10.2, "g/dL", 13, 17) == "LOW"
    assert compute_flag("Fasting Glucose", 130, "mg/dL", 70, 100) == "HIGH"


def test_critical_and_unknown():
    assert compute_flag("Triglycerides", 1200, "mg/dL", None, 150) == "CRITICAL"
    assert compute_flag("Hemoglobin", 6, "g/dL", 13, 17) == "CRITICAL"
    assert compute_flag("TSH", 2.5, "uIU/mL", None, None) == "UNKNOWN"
