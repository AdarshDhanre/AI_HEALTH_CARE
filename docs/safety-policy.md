# Safety policy

1. **No diagnosis, no prescription.** The system never names a disease, medicine or dose.
2. **Flags are rules, not AI.** LOW / HIGH / CRITICAL come from `flag_engine.py` using the reference range printed on the lab's own report plus `critical_values.json`.
3. **Guidance is curated.** Food/lifestyle tips come only from `knowledge_base.json`. An LLM may only reword the template summary and is told not to add facts; if it fails, the template is used.
4. **Doctor in the loop.** Low-confidence extractions are marked "needs review"; a practitioner can correct values (flags are recomputed) and confirm the report.
5. **Disclaimer everywhere** a result or explanation is shown, in the user's language.
6. **Privacy.** Researchers see only aggregates (groups < 3 hidden). Admins manage accounts but cannot open patient data. Every view/edit is audit-logged.
7. **Critical values** in `critical_values.json` are illustrative and MUST be approved by a qualified clinician before real use.
