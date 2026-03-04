import io
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from services.vision_service import describe_image as vision_describe

logger = logging.getLogger("deepeye.describe")
router = APIRouter()


class DescribeImageResponse(BaseModel):
    description: str


@router.post(
    "/describe-image",
    response_model=DescribeImageResponse,
    summary="Describe an image using a vision LLM",
    description="Converts the uploaded image to base64 and sends it to the vLLM /v1/completions endpoint.",
)
async def describe_image(
    image: UploadFile = File(..., description="Image to describe (JPEG / PNG)"),
) -> DescribeImageResponse:
    logger.info("describe-image: file='%s'", image.filename)

    image_bytes: bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file is empty.")

    try:
        description: str = vision_describe(io.BytesIO(image_bytes))
    except Exception as exc:
        logger.error("describe-image: vision model error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Vision model error: {exc}",
        ) from exc

    logger.info("describe-image: %d chars returned", len(description))
    return DescribeImageResponse(description=description)
