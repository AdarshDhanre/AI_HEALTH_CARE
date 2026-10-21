"""Flag implausible values using the plausible ranges in knowledge_base.json.
Usage: python data_validation.py datasets/clean.csv"""
import csv, json, sys
from pathlib import Path

KB = json.loads((Path(__file__).parent.parent / "backend-python/app/core/knowledge/knowledge_base.json").read_text(encoding="utf-8"))["parameters"]


def main(path):
    bad = 0
    with open(path, newline="", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f), start=2):
            p = (KB.get(row["test_name"]) or {}).get("plausible")
            if not p:
                continue
            v = float(str(row["value"]).replace(",", ""))
            if not (p["min"] <= v <= p["max"]):
                bad += 1
                print(f"line {i}: {row['test_name']}={v} outside {p['min']}-{p['max']}")
    print(f"{bad} implausible rows")


if __name__ == "__main__":
    main(sys.argv[1])
