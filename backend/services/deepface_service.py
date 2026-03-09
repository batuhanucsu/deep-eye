import logging
import os
import tempfile
from typing import BinaryIO

import numpy as np
from deepface import DeepFace

from db.chroma_client import FaceRecord, delete_face, list_faces
from models.person_model import FaceAnalysisResult, PersonResponse

logger = logging.getLogger("deepeye.deepface")

# ── DeepFace configuration ─────────────────────────────────────────────────
EMBEDDING_MODEL: str = os.getenv("DEEPFACE_MODEL", "ArcFace")
DETECTOR_BACKEND: str = os.getenv("DEEPFACE_DETECTOR", "retinaface")


# ──────────────────────────────────────────────────────────────────────────
# Custom exceptions
# ──────────────────────────────────────────────────────────────────────────

class FaceNotFoundError(ValueError):
    """
    Raised when DeepFace cannot detect a human face in the given image.
    Callers should surface this as HTTP 422 to the client.
    """
    def __init__(self, detail: str = "No face detected in the provided image.") -> None:
        super().__init__(detail)
        self.detail = detail


# ──────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────

def _write_temp_image(data: bytes, suffix: str = ".jpg") -> str:
    """Write *data* to a named temp file and return its path."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.close()
    return tmp.name


def _record_to_response(record: FaceRecord) -> PersonResponse:
    return PersonResponse(
        id=record.id,
        firstname=record.firstname,
        lastname=record.lastname,
        embedding=record.embedding,
    )


# ──────────────────────────────────────────────────────────────────────────
# Public service API
# ──────────────────────────────────────────────────────────────────────────

def extract_embedding(image: BinaryIO) -> np.ndarray:
    """
    Extract a face embedding from an open image file.

    Parameters
    ----------
    image : BinaryIO
        Any file-like object opened in binary mode (e.g. ``UploadFile.file``,
        ``open(path, "rb")``, ``io.BytesIO``).
        The stream is read once; the caller is responsible for closing it.

    Returns
    -------
    np.ndarray
        1-D float32 array of length 512 (ArcFace) or model-dependent size.

    Raises
    ------
    FaceNotFoundError
        When no face is detected in the image.
    ValueError
        When the image data is empty.
    """
    image_bytes: bytes = image.read()
    if not image_bytes:
        raise ValueError("Image file is empty.")

    tmp_path = _write_temp_image(image_bytes)
    try:
        raw = DeepFace.represent(
            img_path=tmp_path,
            model_name=EMBEDDING_MODEL,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,   # raises ValueError when no face found
        )
    except ValueError as exc:
        # DeepFace raises ValueError("Face could not be detected…") when
        # enforce_detection=True and no face is present.
        logger.warning("extract_embedding: face not detected — %s", exc)
        raise FaceNotFoundError() from exc
    except Exception as exc:
        logger.error("extract_embedding: unexpected error — %s", exc)
        raise
    finally:
        os.unlink(tmp_path)

    embedding: np.ndarray = np.array(raw[0]["embedding"], dtype=np.float32)
    # L2-normalise so ChromaDB cosine distance == 1 - dot_product (range 0–1)
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    logger.debug("extract_embedding: vector shape=%s norm=%.4f", embedding.shape, float(norm))
    return embedding


def analyze_face(image: BinaryIO) -> FaceAnalysisResult:
    """Return age, gender, dominant emotion and race for the face in *image*.

    Raises
    ------
    FaceNotFoundError
        When no face is detected.
    """
    image_bytes: bytes = image.read()
    if not image_bytes:
        raise ValueError("Image file is empty.")

    tmp_path = _write_temp_image(image_bytes)
    try:
        results = DeepFace.analyze(
            img_path=tmp_path,
            actions=["age", "gender", "emotion", "race"],
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
        )
    except ValueError as exc:
        raise FaceNotFoundError() from exc
    finally:
        os.unlink(tmp_path)

    data = results[0]
    return FaceAnalysisResult(
        age=int(data.get("age", 0)),
        gender=data.get("dominant_gender"),
        dominant_emotion=data.get("dominant_emotion"),
        dominant_race=data.get("dominant_race"),
    )


def delete_person(person_id: str) -> None:
    """Remove a person from the database by their UUID."""
    delete_face(person_id)
    logger.info("delete_person: id=%s", person_id)


def get_all_persons() -> list[PersonResponse]:
    """Return every person stored in ChromaDB."""
    return [_record_to_response(r) for r in list_faces()]
