from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, computed_field


class PersonBase(BaseModel):
    firstname: str = Field(..., description="First name of the person")
    lastname: str = Field(..., description="Last name of the person")


class PersonResponse(PersonBase):
    """Face record returned by the API."""

    id: str = Field(..., description="Unique identifier (UUID)")
    embedding: Optional[List[float]] = Field(None, description="512-dim face embedding vector")

    @computed_field  # type: ignore[misc]
    @property
    def full_name(self) -> str:
        return f"{self.firstname} {self.lastname}".strip()

    model_config = {"from_attributes": True}


class SearchResult(BaseModel):
    """Single candidate returned by face search."""

    person: PersonResponse
    distance: float = Field(..., description="Cosine distance (lower = more similar)")
    confidence: float = Field(..., description="Similarity score 0 – 1 (higher = better match)")


class FaceAnalysisResult(BaseModel):
    """Attribute analysis result from DeepFace."""

    age: Optional[int] = None
    gender: Optional[str] = None
    dominant_emotion: Optional[str] = None
    dominant_race: Optional[str] = None
    embedding: Optional[List[float]] = None
