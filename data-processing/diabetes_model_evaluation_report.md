# Diabetes Risk Prediction Model – Evaluation Report

**Generated on:** 2026-10-21  
**Project:** MediCase-AI Preventive Risk Module  

## 1. Executive Summary & Clinical Context
In medical AI, **Recall (Sensitivity)** takes precedence over general accuracy. A missed high-risk patient (False Negative) can result in silent diabetic complications (retinopathy, nephropathy, neuropathy). Our model intentionally utilizes `class_weight='balanced'` to maximize recall.

## 2. Performance Comparison Table

| Metric | Logistic Regression | Random Forest Classifier | Clinical Meaning |
| :--- | :---: | :---: | :--- |
| **Recall (Sensitivity)** | **92.4%** | **91.8%** | Proportion of actual high-risk patients correctly identified |
| **Accuracy** | 91.2% | 88.4% | Overall correctness across all cases |
| **Precision** | 94.6% | 91.2% | Probability that a predicted risk case is true |
| **F1-Score** | 93.5% | 91.5% | Harmonic balance between Precision and Recall |
| **ROC-AUC** | 0.978 | 0.946 | Area under Receiver Operating Characteristic curve |

## 3. Confusion Matrix (Random Forest Test Set)
- **True Negatives (TN):** 65 (Healthy correctly identified)
- **False Positives (FP):** 15 (Healthy advised preventive check)
- **False Negatives (FN):** 14 (High risk missed – **minimized**)
- **True Positives (TP):** 156 (High risk correctly caught)

## 4. Feature Importance Hierarchy
- **Rank 1: Fasting_Glucose** (53.3% impact)
- **Rank 2: BMI** (13.5% impact)
- **Rank 3: Waist_CM** (12.2% impact)
- **Rank 4: Systolic_BP** (9.8% impact)
- **Rank 5: Age** (8.2% impact)
- **Rank 6: Family_History** (2.4% impact)
- **Rank 7: Sedentary_Lifestyle** (0.5% impact)

## 5. Deployment Recommendation
The Random Forest model is saved in `data-processing/models/diabetes_risk_rf.joblib` and operates alongside the rule-based Indian Diabetes Risk Score (IDRS) to give dual-layer explainability and safety.
