"""
ChromaDB client for DeepEye.

Collection : "faces"
Vector space: cosine similarity (suited for normalised face embeddings)

Metadata schema per record
--------------------------
  firstname : str
  lastname  : str

Public API
----------
  add_face(face_id, embedding, firstname, lastname)
  search_face(embedding) -> closest FaceRecord | None
  delete_face(face_id)
  get_face(face_id)      -> FaceRecord | None
  list_faces(limit)      -> list[FaceRecord]
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

import chromadb

logger = logging.getLogger("deepeye.chroma")

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
COLLECTION_NAME: str = "faces"
CHROMA_DATA_PATH: str = os.getenv("CHROMA_DATA_PATH", "./chroma_data")

# ──────────────────────────────────────────────
# Return type
# ──────────────────────────────────────────────
@dataclass
class FaceRecord:
    """A single face stored in / retrieved from ChromaDB."""

    id: str
    firstname: str
    lastname: str
    distance: float = 0.0          # populated only by search_face
    embedding: Optional[list[float]] = None

    @property
    def full_name(self) -> str:
        return f"{self.firstname} {self.lastname}".strip()

    @property
    def confidence(self) -> float:
        """Convert cosine distance to a 0-1 confidence score."""
        return max(0.0, 1.0 - self.distance)


# ──────────────────────────────────────────────
# Singleton client & collection
# ──────────────────────────────────────────────
_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None


def _get_collection() -> chromadb.Collection:
    """Lazily initialise and return the 'faces' collection."""
    global _client, _collection
    if _collection is None:
        logger.info("Initialising ChromaDB at '%s'", CHROMA_DATA_PATH)
        _client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("Collection '%s' ready (%d records)", COLLECTION_NAME, _collection.count())
    return _collection


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def add_face(
    face_id: str,
    embedding: list[float],
    firstname: str,
    lastname: str,
) -> None:
    """
    Persist a face embedding with its owner's name.

    Parameters
    ----------
    face_id   : Unique identifier (e.g. UUID) for this face record.
    embedding : Float vector produced by the face recognition model.
    firstname : Person's first name.
    lastname  : Person's last name.
    """
    _get_collection().add(
        ids=[face_id],
        embeddings=[embedding],
        metadatas=[{"firstname": firstname, "lastname": lastname}],
    )
    logger.debug("add_face: stored id=%s name='%s %s'", face_id, firstname, lastname)


def search_face(embedding: list[float]) -> Optional[FaceRecord]:
    """
    Find the closest face to *embedding* in the database.

    Returns the single best-matching :class:`FaceRecord`, or ``None`` when
    the collection is empty.
    """
    collection = _get_collection()
    if collection.count() == 0:
        logger.debug("search_face: collection is empty")
        return None

    result = collection.query(
        query_embeddings=[embedding],
        n_results=1,
        include=["metadatas", "distances", "embeddings"],
    )

    face_id: str = result["ids"][0][0]
    meta: dict = result["metadatas"][0][0]
    distance: float = float(result["distances"][0][0])
    emb: list[float] | None = (
        result["embeddings"][0][0] if result.get("embeddings") else None
    )

    record = FaceRecord(
        id=face_id,
        firstname=meta.get("firstname", ""),
        lastname=meta.get("lastname", ""),
        distance=distance,
        embedding=list(emb) if emb is not None else None,
    )
    logger.debug(
        "search_face: best match id=%s name='%s' distance=%.4f",
        record.id,
        record.full_name,
        record.distance,
    )
    return record


def search_faces(
    embedding: list[float],
    n_results: int = 5,
) -> list[FaceRecord]:
    """
    Return the *n_results* closest faces ordered by ascending distance.
    Useful for the /get-person endpoint that needs a ranked list.
    """
    collection = _get_collection()
    if collection.count() == 0:
        return []

    n = min(n_results, collection.count())
    result = collection.query(
        query_embeddings=[embedding],
        n_results=n,
        include=["metadatas", "distances", "embeddings"],
    )

    records: list[FaceRecord] = []
    for face_id, meta, dist, emb in zip(
        result["ids"][0],
        result["metadatas"][0],
        result["distances"][0],
        result["embeddings"][0] if result.get("embeddings") else [None] * n,
    ):
        records.append(
            FaceRecord(
                id=face_id,
                firstname=meta.get("firstname", ""),
                lastname=meta.get("lastname", ""),
                distance=float(dist),
                embedding=list(emb) if emb is not None else None,
            )
        )
    return records


def delete_face(face_id: str) -> None:
    """Remove a face record by its ID."""
    _get_collection().delete(ids=[face_id])
    logger.debug("delete_face: removed id=%s", face_id)


def get_face(face_id: str) -> Optional[FaceRecord]:
    """Retrieve a single face record by its exact ID."""
    collection = _get_collection()
    result = collection.get(
        ids=[face_id],
        include=["metadatas", "embeddings"],
    )
    if not result["ids"]:
        return None
    meta = result["metadatas"][0]
    emb = result["embeddings"][0] if result.get("embeddings") else None
    return FaceRecord(
        id=result["ids"][0],
        firstname=meta.get("firstname", ""),
        lastname=meta.get("lastname", ""),
        embedding=list(emb) if emb is not None else None,
    )


def list_faces(limit: int = 100) -> list[FaceRecord]:
    """Return all stored face records (up to *limit*)."""
    collection = _get_collection()
    result = collection.get(limit=limit, include=["metadatas"])
    return [
        FaceRecord(
            id=pid,
            firstname=meta.get("firstname", ""),
            lastname=meta.get("lastname", ""),
        )
        for pid, meta in zip(result["ids"], result["metadatas"])
    ]
