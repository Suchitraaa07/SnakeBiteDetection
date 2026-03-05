from io import BytesIO
from PIL import Image


def read_image_from_bytes(data: bytes) -> Image.Image:
    """Convert raw bytes into a PIL Image.

    Raises an IOError if the bytes do not represent a valid image.
    """
    return Image.open(BytesIO(data)).convert("RGB")
