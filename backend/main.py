import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import describe, person

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("deepeye")

# ──────────────────────────────────────────────
# Lifespan (startup / shutdown hooks)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("DeepEye API starting up…")
    yield
    logger.info("DeepEye API shutting down…")

# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(
    title="DeepEye API",
    description=(
        "AI-powered face recognition and image description API.\n\n"
        "- **POST /load-person** – Register a person with their face embedding\n"
        "- **POST /get-person** – Search for a person by face image\n"
        "- **POST /describe-image** – Generate a natural-language description of an image"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Global exception handler
# ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )

# ──────────────────────────────────────────────
# Routers  (mounted at root – no prefix)
# ──────────────────────────────────────────────
app.include_router(person.router, tags=["Person"])
app.include_router(describe.router, tags=["Describe"])

# ──────────────────────────────────────────────
# Root / Health
# ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root() -> dict:
    """API root – confirms the server is running."""
    return {"service": "DeepEye API", "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health() -> dict:
    """Liveness probe endpoint."""
    return {"status": "ok"}
