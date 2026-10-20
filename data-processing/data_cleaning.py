"""Clean an exported lab-results CSV: trim, normalise test names via the synonym list, drop unusable rows.
Usage: python data_cleaning.py datasets/raw.csv datasets/clean.csv   (columns: test_name,value,unit,...)"""
import csv, json, sys
from pathlib import Path

SYN = json.loads((Path(__file__).parent.parent / "backend-python/app/core/knowledge/test_synonyms.json").read_text(encoding="utf-8"))
LOOKUP = {n.lower(): c for c, names in SYN.items() for n in names + [c]}


def main(src, dst):
    kept = dropped = 0
    with open(src, newline="", encoding="utf-8") as f, open(dst, "w", newline="", encoding="utf-8") as o:
        r = csv.DictReader(f)
        w = csv.DictWriter(o, fieldnames=r.fieldnames)
        w.writeheader()
        for row in r:
            name = LOOKUP.get((row.get("test_name") or "").strip().lower())
            try:
                float(str(row.get("value", "")).replace(",", ""))
            except ValueError:
                name = None
            if not name:
                dropped += 1
                continue
            row["test_name"] = name
            w.writerow(row)
            kept += 1
    print(f"kept {kept}, dropped {dropped}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
