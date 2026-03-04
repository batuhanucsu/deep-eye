"""
Entrypoint for running the DeepEye API with Uvicorn.

Development:
    python run.py

Production (example with Gunicorn + Uvicorn workers):
    gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
"""

import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
RELOAD = os.getenv("RELOAD", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").lower()
WORKERS = int(os.getenv("WORKERS", "1"))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level=LOG_LEVEL,
        workers=1 if RELOAD else WORKERS,  # reload mode is incompatible with multiple workers
        access_log=True,
    )
