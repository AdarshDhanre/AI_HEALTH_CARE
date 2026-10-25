import uvicorn
from app import app

def run():
    port = 8001
    print(f"Ayushman OCR Service running on http://127.0.0.1:{port}")
    uvicorn.run("app:app", host="127.0.0.1", port=port, reload=True, log_level="info")

if __name__ == "__main__":
    run()
