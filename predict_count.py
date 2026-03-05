from PIL import Image
import torch
from torchvision import transforms

# simple preprocessing for counting network (could be same as species)
_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


def predict_count(image: Image.Image, model: torch.nn.Module):
    """Run inference on an image to estimate number of snakes.

    The model is assumed to output either a single regression value or
    a probability distribution over counts. We round to nearest integer.
    """
    tensor = _transform(image).unsqueeze(0)
    with torch.no_grad():
        output = model(tensor)
        # if output is a single value
        if output.numel() == 1:
            count = output.item()
        else:
            # assume classification probabilities
            probs = torch.softmax(output, dim=1)
            _, idx = torch.max(probs, dim=1)
            count = idx.item()

    # clamp to int non-negative
    try:
        count_int = int(round(count))
    except Exception:
        count_int = 0
    if count_int < 0:
        count_int = 0
    return count_int
