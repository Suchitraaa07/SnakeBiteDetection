import argparse
import os
import shutil
from pathlib import Path


CLASS_MAP = {0: "Non Venomous", 1: "Non Venomous", 2: "Venomous"}


def convert_split(images_dir: Path, labels_dir: Path, out_dir: Path):
    images_dir = Path(images_dir)
    labels_dir = Path(labels_dir)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for img_path in images_dir.glob("*"):
        if not img_path.is_file():
            continue
        label_file = labels_dir / (img_path.stem + ".txt")
        if not label_file.exists():
            # skip images with no label file
            continue

        with open(label_file, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]
        if not lines:
            continue

        # take the first label's class index
        try:
            first = lines[0].split()
            cls_idx = int(first[0])
        except Exception:
            continue

        cls_name = CLASS_MAP.get(cls_idx)
        if cls_name is None:
            continue

        target_dir = out_dir / cls_name
        target_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(img_path, target_dir / img_path.name)


def main(root: str):
    root = Path(root)
    # expected structure: train/images, train/labels, valid/images, valid/labels
    mapping = [
        (root / "train" / "images", root / "train" / "labels", root / "train"),
        (root / "valid" / "images", root / "valid" / "labels", root / "valid"),
    ]

    for images_dir, labels_dir, out_split in mapping:
        dest = root / out_split.name
        dest.mkdir(parents=True, exist_ok=True)
        convert_split(images_dir, labels_dir, dest)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert YOLO dataset to classification folders")
    parser.add_argument("--root", default="data/wound", help="Path to data/wound root (contains train/ and valid/)")
    args = parser.parse_args()
    main(args.root)
