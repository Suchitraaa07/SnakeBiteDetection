from PIL import Image
import torch
from torchvision import transforms

# keep the same transformation used during training
_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# Label mapping can be passed from outside or hard‑coded here
# for example purposes assume two classes: 'Non Venomous', 'Venomous'
DEFAULT_CLASSES = ["Non Venomous", "Venomous"]


def _resolve_classes(model: torch.nn.Module, classes):
    """Resolve class labels from argument, model metadata, or defaults."""
    if classes:
        return list(classes)

    model_names = getattr(model, "names", None)
    if isinstance(model_names, dict) and model_names:
        return [model_names[k] for k in sorted(model_names.keys())]
    if isinstance(model_names, (list, tuple)) and model_names:
        return list(model_names)

    return DEFAULT_CLASSES


def predict_species(image: Image.Image, model: torch.nn.Module, classes=None):
    """Run inference on an image to determine presence and species of snake.

    Args:
        image: PIL Image object.
        model: a PyTorch model that returns raw logits or probabilities for species.
        classes: optional list of class names corresponding to model output.

    Returns:
        dict with keys snake_detected (bool), species (str), confidence (float).
    """
    classes = _resolve_classes(model, classes)

    # apply transform and batch dimension
    tensor = _transform(image).unsqueeze(0)

    # match model device and dtype (model may be fp16)
    param = next(model.parameters())
    tensor = tensor.to(device=param.device, dtype=param.dtype)

    with torch.no_grad():
        output = model(tensor)
        # some models return a tuple/list like (logits,); take the first element
        if isinstance(output, (list, tuple)):
            output = output[0]

        model_nc = int(getattr(model, "nc", len(classes)) or len(classes))
        # YOLO detection head output: [B, 4 + nc, N]
        if output.dim() == 3 and output.shape[1] >= 4 + model_nc:
            class_logits = output[:, 4:4 + model_nc, :]
            class_probs = torch.sigmoid(class_logits)
            anchor_conf, anchor_class_idx = class_probs.max(dim=1)  # [B, N], [B, N]
            best_conf, best_anchor_idx = anchor_conf.max(dim=1)     # [B], [B]
            idx = anchor_class_idx.gather(1, best_anchor_idx.unsqueeze(1)).squeeze(1)
            confidence = float(best_conf.item())
            class_idx = int(idx.item())
        else:
            # Classification-like output fallback.
            if output.dim() > 2:
                output = output.flatten(1)
            probs = torch.softmax(output, dim=1)
            confidence_t, idx = torch.max(probs, dim=1)
            confidence = float(confidence_t.item())
            class_idx = int(idx.item())

        if class_idx < 0 or class_idx >= len(classes):
            class_idx = max(0, min(class_idx, len(classes) - 1))
        species_name = classes[class_idx]

    snake_detected = confidence > 0.5 and species_name.lower() != "non venomous"

    return {
        "snake_detected": bool(snake_detected),
        "species": species_name,
        "confidence": float(confidence),
    }
