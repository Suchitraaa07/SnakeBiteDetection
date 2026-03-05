"""
YOLOv8 Training Pipeline for Snake Bite Detection

This script trains a YOLOv8 nano model on the snake bite detection dataset.
The model learns to detect and classify snake bites (venomous vs non-venomous).

Requirements:
    - ultralytics
    - torch
    - Python 3.10+

Dataset structure (YOLOv8 format):
    data/
    ├── train/
    │   ├── images/
    │   └── labels/
    ├── valid/
    │   ├── images/
    │   └── labels/
    ├── test/
    │   ├── images/
    │   └── labels/
    └── data.yaml
"""

from pathlib import Path
from ultralytics import YOLO
import os
import torch


def main():
    """Train YOLOv8 model on snake bite detection dataset."""
    
    # Define paths
    dataset_yaml = "data/data.yaml"
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    print("=" * 70)
    print("YOLOv8 Snake Bite Detection Model Training")
    print("=" * 70)
    
    # Check if dataset exists
    if not Path(dataset_yaml).exists():
        print(f"ERROR: Dataset configuration not found at {dataset_yaml}")
        print("Please ensure the data/data.yaml file exists with proper YOLOv8 format.")
        return False
    
    print(f"\n✓ Dataset configuration found: {dataset_yaml}")
    
    # Load pretrained YOLOv8 nano model
    print("\nLoading YOLOv8 nano pretrained model...")
    # Use the model name rather than a local file so ultralytics
    # will download the weights if they are missing or corrupted.
    # If you prefer to cache the file locally, place a valid
    # yolov8n.pt in this directory; otherwise the library will
    # fetch it automatically from the official repo.
    try:
        model = YOLO("yolov8n")
    except Exception as e:
        # Fallback: if a local file exists but is corrupted, remove
        # it and try again.
        import os
        local = Path("yolov8n.pt")
        if local.exists():
            print(f"\nWARNING: failed loading local weights ({e}). removing file and retrying.")
            local.unlink()
        model = YOLO("yolov8n")
    print("✓ Model loaded successfully")
    
    # Auto-detect device: use GPU if available, else CPU
    if torch.cuda.is_available():
        device = 0  # Use first GPU
        print(f"\n✓ GPU detected: {torch.cuda.get_device_name(0)}")
        epochs = 100
        batch = 8
    else:
        device = "cpu"
        print("\n⚠ No GPU detected. Using CPU (training will be slow).")
        print("  Consider using a machine with CUDA support for faster training.")
        # Reduce training load for CPU
        epochs = 25  # Reduced from 100
        batch = 4   # Reduced from 8
    
    # Training configuration
    training_config = {
        "data": dataset_yaml,
        "epochs": epochs,
        "imgsz": 640,
        "batch": batch,
        "device": device,
        "patience": 20,
        "save": True,
        "verbose": True,
        "project": str(models_dir),
        "name": "snake_bite_detector",
        "exist_ok": True,  # Overwrite existing runs
        "augment": True,  # Enable data augmentation
        "mosaic": 1.0,  # Mosaic augmentation
        "flipud": 0.5,  # Vertical flip probability
        "fliplr": 0.5,  # Horizontal flip probability
        "degrees": 10.0,  # Rotation degrees
        "translate": 0.1,  # Translation
        "scale": 0.5,  # Scale
        "hsv_h": 0.015,  # HSV hue shift
        "hsv_s": 0.7,  # HSV saturation shift
        "hsv_v": 0.4,  # HSV value shift
        "lr0": 0.01,  # Initial learning rate
        "lrf": 0.01,  # Final learning rate
        "momentum": 0.937,  # Optimizer momentum
        "weight_decay": 0.0005,  # L2 regularization
        "warmup_epochs": 3.0,  # Warmup epochs
        "close_mosaic": 10,  # Disable mosaic on final epochs
    }
    
    print("\n" + "=" * 70)
    print("Training Configuration:")
    print("=" * 70)
    for key, value in training_config.items():
        print(f"  {key:<20}: {value}")
    print("=" * 70)
    
    # Start training
    print("\n🚀 Starting training...\n")
    results = model.train(**training_config)
    
    # Training complete
    print("\n" + "=" * 70)
    print("✓ Training Complete!")
    print("=" * 70)
    
    # Copy the best model to models folder
    # YOLOv8 saves to runs/detect/ by default, not directly to project path
    best_model_path = Path("runs") / "detect" / "models" / "snake_bite_detector" / "weights" / "best.pt"
    final_model_path = models_dir / "snake_model.pt"
    
    if best_model_path.exists():
        import shutil
        shutil.copy(str(best_model_path), str(final_model_path))
        print(f"\n✓ Best model exported to: {final_model_path}")
    else:
        print(f"\nERROR: Best model not found at {best_model_path}")
        print("Training output directory structure:")
        if (Path("runs") / "detect" / "models" / "snake_bite_detector").exists():
            for item in (Path("runs") / "detect" / "models" / "snake_bite_detector").rglob("*"):
                if item.is_file():
                    print(f"  {item.relative_to(Path('runs').parent)}")
        else:
            print(f"  {Path('runs') / 'detect' / 'models' / 'snake_bite_detector'} does not exist")
        print("\nFAILURE REASON: Training may have crashed or not completed successfully.")
        print("Check the training output above for errors.")
        return False
    
    # Print summary
    print("\n" + "=" * 70)
    print("Training Summary:")
    print("=" * 70)
    print(f"Final model location: {final_model_path.absolute()}")
    print(f"Log directory: {models_dir / 'snake_bite_detector'}")
    print("\nNext steps:")
    print("  1. Review training results and metrics")
    print("  2. Run inference with: python utils/wound_inference.py <image_path>")
    print("  3. Validate on test set: python scripts/test_wound_inference.py")
    print("=" * 70)
    
    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)