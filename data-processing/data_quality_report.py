"""Quick completeness report: rows per test, missing units / reference ranges.
Usage: python data_quality_report.py datasets/clean.csv"""
import csv, sys
from collections import Counter


def main(path):
    total, tests, no_unit, no_ref = 0, Counter(), 0, 0
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            total += 1
            tests[row["test_name"]] += 1
            no_unit += not (row.get("unit") or "").strip()
            no_ref += not ((row.get("ref_low") or "").strip() or (row.get("ref_high") or "").strip())
    print(f"rows: {total}\nmissing unit: {no_unit}\nmissing reference range: {no_ref}")
    for t, n in tests.most_common():
        print(f"  {t}: {n}")


if __name__ == "__main__":
    main(sys.argv[1])

