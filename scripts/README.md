# Helper Scripts

This directory contains maintenance, utility, and data reprocessing scripts for the MediCase-AI platform.

### Available Scripts

#### 1. `reprocess_reports.py`
Reprocesses previously failed or unparsed diagnostic reports by sending them to the FastAPI AI processing endpoint (`POST /process-report`) and generating database update statements.

**How to run:**
```powershell
.\backend-python\.venv\Scripts\python.exe scripts\reprocess_reports.py
```
