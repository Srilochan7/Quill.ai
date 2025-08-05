from PyPDF2 import PdfReader
from io import BytesIO

def extract_text(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages)
