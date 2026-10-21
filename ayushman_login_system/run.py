import uvicorn
from app import app

def run():
    port = 8001
    print(f"Ayushman OCR Service running on http://127.0.0.1:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

if __name__ == "__main__":
    run()
