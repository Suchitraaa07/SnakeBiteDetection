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
SPECIES_MODEL_PATH = MODELS_DIR / "snake_species_model.pt"
COUNT_MODEL_PATH = MODELS_DIR / "snake_count_model.pt"


def load_models(device: torch.device = torch.device("cpu")):
    global _species_model, _count_model

    if _species_model is None:
        path = SPECIES_MODEL_PATH

        if not path.exists():
            alt = MODELS_DIR / "snake_model.pt"
            if alt.exists():
                path = alt
                print(f"Warning: using fallback species model {alt.name}")

        if not path.exists():
            raise FileNotFoundError(
                f"Species model not found. Expected {SPECIES_MODEL_PATH}"
            )

        ckpt = torch.load(path, map_location=device, weights_only=False)

        model = ckpt.get("model") if isinstance(ckpt, dict) else ckpt
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

