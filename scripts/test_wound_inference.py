"""Simple utility to run the wound inference on one or more images.

Usage:
    python scripts/test_wound_inference.py /path/to/image1.jpg [/path/to/image2.png ...]

If a directory is supplied, all files with common image extensions are processed.
"""
import sys
from pathlib import Path

from utils.wound_inference import WoundInference


def main(args):
    if len(args) < 2:
        print("Usage: python scripts/test_wound_inference.py <image_or_dir> [more_images...]")
        sys.exit(1)

    infer = WoundInference()
    paths = []
    for item in args[1:]:
        p = Path(item)
        if p.is_dir():
            paths.extend([x for x in p.iterdir() if x.suffix.lower() in ('.jpg','.jpeg','.png','.bmp','.webp','.tiff')])
        elif p.is_file():
            paths.append(p)

    if not paths:
        print("No images found to run inference on.")
        sys.exit(0)

    for img in paths:
        out = infer.predict(str(img))
        print(f"{img.name}: {out}")


if __name__ == "__main__":
    main(sys.argv)
