import torch
from pathlib import Path
from ultralytics.nn.tasks import DetectionModel
import torch.serialization

# allow ultralytics model class
torch.serialization.add_safe_globals([DetectionModel])

torch.backends.cudnn.benchmark = True
_species_model = None
_count_model = None

MODELS_DIR = Path("models")
SPECIES_MODEL_PATH = MODELS_DIR / "snake_model.pth"
COUNT_MODEL_PATH = MODELS_DIR / "snake_count_model.pt"


def load_models(device: torch.device = torch.device("cpu")):
    global _species_model, _count_model

    if _species_model is None:
        path = MODELS_DIR / "snake_model.pth"
        if not path.exists():
            raise FileNotFoundError(
                f"Species model not found. Expected {path}"
            )
        from torchvision import models
        import torch.nn as nn
        model = models.mobilenet_v3_small(weights=None)
        model.classifier[3] = nn.Linear(1024, 2)
        state_dict = torch.load(path, map_location=device)
        model.load_state_dict(state_dict)
        model.eval()
        _species_model = model

    if _count_model is None:
        path = COUNT_MODEL_PATH

        if not path.exists():
            print(
                f"Warning: count model not found at {COUNT_MODEL_PATH}. "
                "Snake count will fall back to default."
            )
            _count_model = None
        else:
            _count_model = torch.load(path, map_location=device)
            _count_model.eval()

    return _species_model, _count_model

