import base64
import io
import logging
import os
from typing import BinaryIO

import requests
from PIL import Image

logger = logging.getLogger("deepeye.vision")

# ── Configuration ──────────────────────────────────────────────────────
VLLM_BASE_URL: str = os.getenv("VLLM_BASE_URL", "https://vllm.portalgrup.ai/art")
VLLM_API_KEY: str = os.getenv("VLLM_API_KEY", "")
VLLM_MODEL: str = os.getenv("VLLM_MODEL", "Qwen/Qwen2.5-VL-72B-Instruct-AWQ")
VLLM_MAX_TOKENS: int = int(os.getenv("VLLM_MAX_TOKENS", "512"))
VLLM_TEMPERATURE: float = float(os.getenv("VLLM_TEMPERATURE", "0.2"))
VLLM_TIMEOUT: int = int(os.getenv("VLLM_TIMEOUT", "60"))

DEFAULT_PROMPT: str = "Describe what you see in this image."


# Maximum long-side pixel size before encoding – keeps token count under 4096
VLLM_MAX_IMAGE_SIZE: int = int(os.getenv("VLLM_MAX_IMAGE_SIZE", "768"))


# ── Helpers ──────────────────────────────────────────────────────

def _to_base64(image: BinaryIO) -> str:
    """Resize image so its longest side is ≤ VLLM_MAX_IMAGE_SIZE, then
    return a JPEG base64-encoded string."""
    img = Image.open(image).convert("RGB")
    max_side = VLLM_MAX_IMAGE_SIZE
    if max(img.width, img.height) > max_side:
        img.thumbnail((max_side, max_side), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ── Public API ──────────────────────────────────────────────────────

def describe_image(image: BinaryIO, prompt: str | None = None) -> str:
    """
    Send *image* to the vLLM ``/v1/completions`` endpoint and return the
    generated text description.

    Parameters
    ----------
    image  : BinaryIO  – file-like object (e.g. ``UploadFile.file``, ``BytesIO``).
    prompt : str | None – custom instruction; falls back to DEFAULT_PROMPT.

    Returns
    -------
    str  – The model’s text response.

    Raises
    ------
    requests.HTTPError
        When the vLLM server returns a non-2xx status code.
    KeyError
        When the response JSON structure is unexpected.
    """
    b64: str = _to_base64(image)
    user_prompt: str = prompt or DEFAULT_PROMPT

    # Qwen2.5-VL uses /v1/chat/completions with image_url content parts
    payload: dict = {
        "model": VLLM_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64}"
                        },
                    },
                    {
                        "type": "text",
                        "text": user_prompt,
                    },
                ],
            }
        ],
        "max_tokens": VLLM_MAX_TOKENS,
        "temperature": VLLM_TEMPERATURE,
    }

    headers: dict = {"Content-Type": "application/json"}
    if VLLM_API_KEY:
        headers["Authorization"] = f"Bearer {VLLM_API_KEY}"

    logger.debug("describe_image: POST %s/v1/chat/completions", VLLM_BASE_URL)
    response = requests.post(
        f"{VLLM_BASE_URL}/v1/chat/completions",
        json=payload,
        headers=headers,
        timeout=VLLM_TIMEOUT,
    )
    response.raise_for_status()

    data: dict = response.json()
    text: str = data["choices"][0]["message"]["content"].strip()
    logger.debug("describe_image: received %d chars", len(text))
    return text
