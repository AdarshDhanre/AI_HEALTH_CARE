from pathlib import Path
from app.services.extraction_service import extract_results, extract_report_date

TXT = (Path(__file__).parent / "sample_reports" / "sample_cbc.txt").read_text(encoding="utf-8")


def test_extracts_nine_tests():
    rows = {r["test_name"]: r for r in extract_results(TXT)}
    assert len(rows) == 9
    assert rows["Hemoglobin"]["value"] == 10.2 and rows["Hemoglobin"]["ref_low"] == 13.0
    assert rows["WBC"]["value"] == 7200
    assert rows["Triglycerides"]["ref_high"] == 150
    assert rows["HbA1c"]["unit"] == "%"


def test_report_date():
    assert extract_report_date(TXT) == "2026-08-15"
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
    assert extract_report_date("Report Date: 15/08/2026") == "2026-08-15"


def test_report_date_accepts_unambiguous_month_first_format():
    assert extract_report_date("Report Date: 08/15/2026") == "2026-08-15"
<<<<<<< HEAD
=======
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
