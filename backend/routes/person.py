import io
import logging
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from db.chroma_client import add_face, search_face as db_search_face
from models.person_model import FaceAnalysisResult, PersonResponse
from services.deepface_service import (
    FaceNotFoundError,
    analyze_face,
    delete_person,
    extract_embedding,
    get_all_persons,
)

logger = logging.getLogger("deepeye.person")
router = APIRouter()

FACE_IMAGES_DIR = Path(os.getenv(
    "FACE_IMAGES_DIR",
    str(Path(__file__).resolve().parent.parent / "face_images")
))
FACE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)


class LoadPersonResponse(BaseModel):
    status: str = "success"


# ──────────────────────────────────────────────
# POST /load-person
# ──────────────────────────────────────────────
@router.post(
    "/load-person",
    response_model=LoadPersonResponse,
    summary="Register a new person",
    description=(
        "Accepts a multipart form with **firstname**, **lastname** and a face **image**. "
        "Extracts a face embedding via DeepFace and stores it in the 'faces' ChromaDB collection."
    ),
)
async def load_person(
    firstname: str = Form(..., description="First name of the person"),
    lastname: str = Form(..., description="Last name of the person"),
    image: UploadFile = File(..., description="Clear face photo (JPEG / PNG)"),
) -> LoadPersonResponse:
    logger.info("load-person: registering '%s %s'", firstname, lastname)

    # 1. Read image bytes once so we can reuse for both embedding and saving
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file is empty.")

    # 2. Extract face embedding
    try:
        embedding = extract_embedding(io.BytesIO(image_bytes))
    except FaceNotFoundError as exc:
        raise HTTPException(status_code=422, detail=exc.detail) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.warning("load-person: embedding failed: %s", exc)
        raise HTTPException(status_code=422, detail=f"Embedding extraction failed: {exc}") from exc

    # 3. Persist embedding + metadata to ChromaDB
    face_id = str(uuid.uuid4())
    try:
        add_face(
            face_id=face_id,
            embedding=embedding.tolist(),
            firstname=firstname.strip(),
            lastname=lastname.strip(),
        )
    except Exception as exc:
        logger.error("load-person: db write failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc

    # 4. Save the face image to disk
    try:
        ext = Path(image.filename or "face.jpg").suffix or ".jpg"
        if ext.lower() == ".jfif":
            ext = ".jpg"
        image_path = FACE_IMAGES_DIR / f"{face_id}{ext}"
        image_path.write_bytes(image_bytes)
        logger.info("load-person: image saved to %s", image_path)
    except Exception as exc:
        logger.error("load-person: image save failed: %s", exc)

    logger.info("load-person: stored id=%s name='%s %s'", face_id, firstname, lastname)
    return LoadPersonResponse(status="success")


# ──────────────────────────────────────────────
# POST /get-person
# ──────────────────────────────────────────────
class GetPersonResponse(BaseModel):
    firstname: str
    lastname: str
    confidence: float


@router.post(
    "/get-person",
    response_model=GetPersonResponse,
    summary="Find closest person by face image",
    description=(
        "Upload a face image. DeepFace extracts an embedding, ChromaDB finds the "
        "closest stored vector, and the endpoint returns the person's name with a "
        "confidence score (0 – 1)."
    ),
)
async def get_person(
    image: UploadFile = File(..., description="Query face photo (JPEG / PNG)"),
) -> GetPersonResponse:
    logger.info("get-person: received file='%s'", image.filename)

    # 1. Extract embedding from uploaded image
    try:
        embedding = extract_embedding(image.file)
    except FaceNotFoundError as exc:
        raise HTTPException(status_code=422, detail=exc.detail) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.warning("get-person: embedding failed: %s", exc)
        raise HTTPException(status_code=422, detail=f"Embedding extraction failed: {exc}") from exc

    # 2. Find the closest vector in ChromaDB
    record = db_search_face(embedding.tolist())

    if record is None:
        raise HTTPException(status_code=404, detail="No persons registered in the database.")

    # 3. Reject low-confidence matches
    CONFIDENCE_THRESHOLD = 0.50
    if record.confidence < CONFIDENCE_THRESHOLD:
        logger.info(
            "get-person: no match above threshold (best=%.4f threshold=%.2f)",
            record.confidence, CONFIDENCE_THRESHOLD,
        )
        raise HTTPException(status_code=404, detail="No matching person found.")

    # 4. Return firstname, lastname and confidence derived from cosine distance
    logger.info(
        "get-person: matched '%s %s' confidence=%.4f",
        record.firstname, record.lastname, record.confidence,
    )
    return GetPersonResponse(
        firstname=record.firstname,
        lastname=record.lastname,
        confidence=round(record.confidence, 4),
    )


# ──────────────────────────────────────────────
# POST /analyze-face
# ──────────────────────────────────────────────
@router.post(
    "/analyze-face",
    response_model=FaceAnalysisResult,
    summary="Analyze face attributes",
    description="Returns estimated age, gender, dominant emotion and race for a face image.",
)
async def analyze_face_endpoint(
    image: UploadFile = File(..., description="Face image to analyze"),
) -> FaceAnalysisResult:
    logger.info("analyze-face: file='%s'", image.filename)
    try:
        result = analyze_face(image=image.file)
    except FaceNotFoundError as exc:
        raise HTTPException(status_code=422, detail=exc.detail) from exc
    except Exception as exc:
        logger.warning("analyze-face failed: %s", exc)
        raise HTTPException(status_code=422, detail=f"Face analysis failed: {exc}") from exc

    return result


# ──────────────────────────────────────────────
# GET /persons
# ──────────────────────────────────────────────
@router.get(
    "/persons",
    response_model=list[PersonResponse],
    summary="List all registered persons",
)
def list_persons() -> list[PersonResponse]:
    """Return every person stored in the ChromaDB collection."""
    return get_all_persons()


# ──────────────────────────────────────────────
# GET /persons/{person_id}/image
# ──────────────────────────────────────────────
@router.get(
    "/persons/{person_id}/image",
    summary="Get face image of a registered person",
)
def get_person_image(person_id: str) -> FileResponse:
    """Return the stored face image for the given person ID."""
    matches = list(FACE_IMAGES_DIR.glob(f"{person_id}.*"))
    if matches:
        path = matches[0]
        suffix = path.suffix.lower().lstrip(".")
        media_type = f"image/{'jpeg' if suffix in ('jpg', 'jfif') else suffix}"
        return FileResponse(path, media_type=media_type)
    raise HTTPException(status_code=404, detail="Image not found for this person.")


# ──────────────────────────────────────────────
# DELETE /persons/{person_id}
# ──────────────────────────────────────────────
@router.delete(
    "/persons/{person_id}",
    summary="Delete a person by ID",
)
def delete_person_endpoint(person_id: str) -> dict:
    """Remove a registered person, their embedding, and their image from the database."""
    logger.info("delete-person: id=%s", person_id)
    delete_person(person_id)
    # Remove saved face image if it exists
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        path = FACE_IMAGES_DIR / f"{person_id}{ext}"
        if path.exists():
            path.unlink()
            logger.debug("delete-person: removed image %s", path)
            break
    return {"message": f"Person {person_id} deleted successfully."}
