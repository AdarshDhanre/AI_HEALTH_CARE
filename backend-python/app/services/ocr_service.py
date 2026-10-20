"""PDF text layer first (pdfplumber); fall back to Tesseract for scans and images."""
import io
from PIL import Image
from app.core.config import settings
from app.utils.image_preprocess import preprocess

MIN_TEXT_CHARS = 40


def _tesseract():
    import pytesseract
    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
    return pytesseract


def _ocr_image(img: Image.Image) -> str:
    return _tesseract().image_to_string(preprocess(img), lang=settings.ocr_languages, config="--psm 6")


def extract_text(data: bytes, filename: str) -> tuple[str, str]:
    """Returns (text, method) where method is pdf-text | pdf-ocr | image-ocr."""
    name = (filename or "").lower()
    if name.endswith(".pdf") or data[:4] == b"%PDF":
        import pdfplumber
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = "\n".join((p.extract_text() or "") for p in pdf.pages)
        if len(text.strip()) >= MIN_TEXT_CHARS:
            return text, "pdf-text"
        from pdf2image import convert_from_bytes
        kwargs = {"poppler_path": settings.poppler_path} if settings.poppler_path else {}
        pages = convert_from_bytes(data, dpi=250, **kwargs)
        return "\n".join(_ocr_image(p) for p in pages), "pdf-ocr"
    img = Image.open(io.BytesIO(data))
    return _ocr_image(img), "image-ocr"
