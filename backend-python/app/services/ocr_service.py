"""PDF text layer first (pdfplumber); fall back to pypdfium2 / pdf2image + Tesseract for scans and images."""
import io
import os
import shutil
from PIL import Image
from app.core.config import settings
from app.utils.image_preprocess import preprocess

MIN_TEXT_CHARS = 40

TESSERACT_CANDIDATES = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe\tesseract.exe",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]


def _resolve_exe(path: str) -> str:
    """Resolve a candidate path to an executable file."""
    if not path:
        return ""
    if os.path.isfile(path):
        return path
    if os.path.isdir(path):
        sub = os.path.join(path, "tesseract.exe")
        if os.path.isfile(sub):
            return sub
    return ""


def _find_tesseract() -> str:
    """Return the path to tesseract.exe, searching settings then known locations."""
    if settings.tesseract_cmd:
        resolved = _resolve_exe(settings.tesseract_cmd)
        if resolved:
            return resolved
    for cand in TESSERACT_CANDIDATES:
        resolved = _resolve_exe(cand)
        if resolved:
            return resolved
    which = shutil.which("tesseract")
    if which:
        resolved = _resolve_exe(which)
        if resolved:
            return resolved
    return ""


def _configure_tesseract() -> None:
    """Eagerly configure pytesseract at import time."""
    try:
        import pytesseract
        cmd = _find_tesseract()
        if cmd:
            pytesseract.pytesseract.tesseract_cmd = cmd
            tessdata = os.path.join(os.path.dirname(cmd), "tessdata")
            if os.path.exists(tessdata):
                os.environ.setdefault("TESSDATA_PREFIX", tessdata)
    except Exception:
        pass


# Configure once at module import time
_configure_tesseract()


def _tesseract():
    import pytesseract
    cmd = _find_tesseract()
    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd
        tessdata = os.path.join(os.path.dirname(cmd), "tessdata")
        if os.path.exists(tessdata):
            os.environ.setdefault("TESSDATA_PREFIX", tessdata)
    return pytesseract


def _ocr_image(img: Image.Image) -> str:
    return _tesseract().image_to_string(preprocess(img), lang=settings.ocr_languages, config="--psm 6")


def extract_text(data: bytes, filename: str) -> tuple[str, str]:
    """Returns (text, method) where method is pdf-text | pdf-ocr | image-ocr."""
    name = (filename or "").lower()
    if name.endswith(".pdf") or data[:4] == b"%PDF":
        import pdfplumber
        try:
            with pdfplumber.open(io.BytesIO(data)) as pdf:
                text = "\n".join((p.extract_text() or "") for p in pdf.pages)
            if len(text.strip()) >= MIN_TEXT_CHARS:
                return text, "pdf-text"
        except Exception:
            pass

        # If digital text extraction didn't yield enough characters, use OCR on rendered pages.
        # Prefer pypdfium2 as it does not require external poppler binaries.
        pages = []
        try:
            import pypdfium2 as pdfium
            doc = pdfium.PdfDocument(data)
            # Render up to first 10 pages to avoid unbounded OCR latency
            for idx in range(min(len(doc), 10)):
                pages.append(doc[idx].render(scale=2.0).to_pil())
        except Exception:
            # Fall back to pdf2image if pypdfium2 is not available
            try:
                from pdf2image import convert_from_bytes
                kwargs = {"poppler_path": settings.poppler_path} if settings.poppler_path else {}
                pages = convert_from_bytes(data, dpi=250, **kwargs)
            except Exception as e:
                raise RuntimeError(
                    f"Could not convert PDF to images for OCR: {e}. "
                    "Please ensure pypdfium2 is installed or Poppler is installed and added to PATH."
                )

        if not pages:
            raise RuntimeError("PDF contains no readable pages.")

        ocr_results = [_ocr_image(p) for p in pages]
        return "\n".join(ocr_results), "pdf-ocr"

    img = Image.open(io.BytesIO(data))
    return _ocr_image(img), "image-ocr"
