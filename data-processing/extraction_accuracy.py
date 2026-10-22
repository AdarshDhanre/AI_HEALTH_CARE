"""What % of values did the extractor get right?
Usage: python extraction_accuracy.py report.txt truth.json
truth.json = {"Hemoglobin": 10.2, "WBC": 7200, ...}   (text = OCR/PDF text of one report)
Run from the repo root so the backend-python package is importable."""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend-python"))
from app.services.extraction_service import extract_results  # noqa: E402


def main(txt_path, truth_path):
    truth = json.loads(Path(truth_path).read_text(encoding="utf-8"))
    got = {r["test_name"]: r["value"] for r in extract_results(Path(txt_path).read_text(encoding="utf-8"))}
    ok = sum(1 for k, v in truth.items() if k in got and abs(got[k] - v) < 1e-6)
    print(f"correct: {ok}/{len(truth)} = {100 * ok / max(len(truth), 1):.1f}%")
    print("missed:", [k for k in truth if k not in got])
    print("wrong :", [(k, got[k], truth[k]) for k in truth if k in got and abs(got[k] - truth[k]) >= 1e-6])
    print("extra :", [k for k in got if k not in truth])


if __name__ == "__main__":
    main(*sys.argv[1:3])
