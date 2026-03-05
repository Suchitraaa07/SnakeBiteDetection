import torch
from pathlib import Path

# Module-level variables to cache models
torch.backends.cudnn.benchmark = True
_species_model = None
_count_model = None

MODELS_DIR = Path("models")
SPECIES_MODEL_PATH = MODELS_DIR / "snake_species_model.pt"
COUNT_MODEL_PATH = MODELS_DIR / "snake_count_model.pt"


def load_models(device: torch.device = torch.device("cpu")):
    """Load and cache the species and count models.

    The models are loaded only once and then re-used for every request.
    """
    global _species_model, _count_model

    if _species_model is None:
        # allow fallback to legacy filename
        path = SPECIES_MODEL_PATH
        if not path.exists():
            alt = MODELS_DIR / "snake_model.pt"
            if alt.exists():
                path = alt
                print(f"Warning: using fallback species model {alt.name}")
        if not path.exists():
            raise FileNotFoundError(
                f"Species model not found. Expected {SPECIES_MODEL_PATH} (or snake_model.pt)"
            )
        # PyTorch 2.6+ defaults weights_only=True which breaks loading
        # checkpoints that contain full model objects (like ultralytics YOLO).
        # We explicitly set weights_only=False here, as the checkpoint is local
        # and trusted for this application. Ultralytics checkpoints are usually
        # dicts with a 'model' key.
        ckpt = torch.load(path, map_location=device, weights_only=False)
        model = ckpt.get("model") if isinstance(ckpt, dict) else ckpt
        model.eval()
        _species_model = model

    if _count_model is None:
        path = COUNT_MODEL_PATH
        if not path.exists():
            # For this project the count model is optional – we can still
            # run species prediction without it.
            print(
                f"Warning: count model not found at {COUNT_MODEL_PATH}. "
                "Snake count will fall back to a default value."
            )
            _count_model = None
        else:
            _count_model = torch.load(path, map_location=device)
            _count_model.eval()

    return _species_model, _count_model
