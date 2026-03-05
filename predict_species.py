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


def predict_species(image: Image.Image, model: torch.nn.Module, classes=None):
    """Run inference on an image to determine presence and species of snake.

    Args:
        image: PIL Image object.
        model: a PyTorch model that returns raw logits or probabilities for species.
        classes: optional list of class names corresponding to model output.

    Returns:
        dict with keys snake_detected (bool), species (str), confidence (float).
    """
    if classes is None:
        classes = DEFAULT_CLASSES

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
        # Reduce extra spatial / anchor dimensions so we end up with
        # shape [batch, num_classes] before softmax.
        if output.dim() > 2:
            reduce_dims = tuple(range(1, output.dim() - 1))
            output = output.mean(dim=reduce_dims)
        probs = torch.softmax(output, dim=1)
        confidence, idx = torch.max(probs, dim=1)
        confidence = confidence.item()
        species_name = classes[idx.item()]

    snake_detected = confidence > 0.5 and species_name.lower() != "non venomous"

    return {
        "snake_detected": bool(snake_detected),
        "species": species_name,
        "confidence": float(confidence),
    }
