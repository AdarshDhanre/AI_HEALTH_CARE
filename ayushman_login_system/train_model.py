from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

DATA = Path("data/annotations/line_labels.csv")
OUT = Path("models")
OUT.mkdir(exist_ok=True)

if not DATA.exists():
    raise SystemExit("Dataset missing. Run: python generate_synthetic_dataset.py")

df = pd.read_csv(DATA).dropna(subset=["text", "label"])
X_train, X_test, y_train, y_test = train_test_split(
    df["text"].astype(str), df["label"].astype(str),
    test_size=0.25, random_state=42, stratify=df["label"].astype(str)
)

model = Pipeline([
    ("tfidf", TfidfVectorizer(analyzer="char", ngram_range=(2, 5), lowercase=True)),
    ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced"))
])
model.fit(X_train, y_train)
pred = model.predict(X_test)
print("Held-out synthetic line accuracy:", round(accuracy_score(y_test, pred), 4))
print(classification_report(y_test, pred, zero_division=0))

joblib.dump(model, OUT / "field_classifier.joblib")
metrics = {
    "accuracy_on_synthetic_holdout": float(accuracy_score(y_test, pred)),
    "train_rows": int(len(X_train)),
    "test_rows": int(len(X_test)),
    "warning": "Synthetic-only metrics do not predict performance on real cards."
}
(OUT / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
print("Saved model to models/field_classifier.joblib")
