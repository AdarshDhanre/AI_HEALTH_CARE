from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.core.config import settings
from app.core.security import verify_api_key
from app.schemas.report_schema import EvalRequest, EvalResponse, LabResultOut, ProcessResponse
from app.services import extraction_service as ex, flag_engine, ocr_service, safety_service, validation_service

router = APIRouter(dependencies=[Depends(verify_api_key)])
ALLOWED = (".pdf", ".png", ".jpg", ".jpeg")


@router.post("/process-report", response_model=ProcessResponse)
async def process_report(file: UploadFile = File(...)):
    name = file.filename or ""
    if not name.lower().endswith(ALLOWED):
        raise HTTPException(400, "Only PDF, PNG or JPG files are supported")
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "File too large")
    try:
        text, method = ocr_service.extract_text(data, name)
    except Exception as e:
        raise HTTPException(422, f"Could not read the file: {e}")

    rows = [validation_service.validate(r) for r in ex.extract_results(text)]
    results = []
    for r in rows:
        r["flag"] = flag_engine.compute_flag(r["test_name"], r["value"], r["unit"], r["ref_low"], r["ref_high"])
        r["safety_level"] = safety_service.level_for(r["flag"])
        results.append(LabResultOut(**r))
    warnings = [] if results else ["No known lab tests were recognised in this report"]
    return ProcessResponse(extraction_method=method, lab_name=ex.extract_lab_name(text),
                           report_date=ex.extract_report_date(text),
                           overall_level=safety_service.overall_level([r.flag for r in results]),
                           results=results, warnings=warnings)


@router.post("/evaluate", response_model=EvalResponse)
def evaluate(req: EvalRequest):
    flag = flag_engine.compute_flag(req.test_name, req.value, req.unit, req.ref_low, req.ref_high)
    return EvalResponse(flag=flag, safety_level=safety_service.level_for(flag))
