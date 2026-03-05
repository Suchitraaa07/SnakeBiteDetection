import argparse
import os
import shutil
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


def get_dataloaders(data_root, batch_size=16):
    data_root = Path(data_root)
    train_dir = data_root / "train"
    val_dir = data_root / "valid"

    # remove any empty class folders so ImageFolder doesn't raise
    for split in (train_dir, val_dir):
        if split.exists():
            for cls in split.iterdir():
                if cls.is_dir():
                    contains = any(cls.glob("*"))
                    if not contains:
                        print(f"[WARNING] removing empty folder {cls}")
                        try:
                            shutil.rmtree(cls)
                        except Exception:
                            pass

    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    train_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        normalize,
    ])
    val_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        normalize,
    ])

    train_ds = datasets.ImageFolder(str(train_dir), transform=train_tf)
    val_ds = datasets.ImageFolder(str(val_dir), transform=val_tf)

    if len(train_ds) == 0:
        raise RuntimeError("No training images found - please run the conversion script or populate data/wound/train")
    if len(val_ds) == 0:
        print("[WARNING] Validation set contains no images. Training will proceed without validation checks.")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2) if len(val_ds) > 0 else None

    return train_loader, val_loader


def build_model(device):
    model = models.mobilenet_v3_small(pretrained=True)
    # replace final classifier to 2 classes
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, 2)
    model = model.to(device)
    return model


def train(data_root, epochs, batch_size, save_path, device):
    train_loader, val_loader = get_dataloaders(data_root, batch_size=batch_size)
    model = build_model(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters())

    best_acc = 0.0
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        running_corrects = 0
        total = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            running_corrects += torch.sum(preds == labels.data).item()
            total += inputs.size(0)

        epoch_loss = running_loss / max(total, 1)
        epoch_acc = running_corrects / max(total, 1)

        # validation
        model.eval()
        val_corrects = 0
        val_total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                val_corrects += torch.sum(preds == labels.data).item()
                val_total += inputs.size(0)

        val_acc = val_corrects / max(val_total, 1)
        print(f"Epoch {epoch+1}/{epochs} - loss: {epoch_loss:.4f} train_acc: {epoch_acc:.4f} val_acc: {val_acc:.4f}")

        if val_acc > best_acc:
            best_acc = val_acc
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model.state_dict(), save_path)

    print(f"Training complete. Best val acc: {best_acc:.4f}. Model saved to {save_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train wound classification model")
    parser.add_argument("--data_root", default="data/wound", help="Path to data/wound root")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--save_path", default="models/wound_model.pth")
    args = parser.parse_args()

    # quick check for YOLO-format leftover directories
    yolo_images = Path(args.data_root) / "train" / "images"
    if yolo_images.exists():
        print("[NOTICE] It looks like you still have YOLO-style train/images directories.")
        print("Run scripts/convert_yolo_to_classification.py first to prepare the dataset.")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    train(args.data_root, args.epochs, args.batch_size, args.save_path, device)
