# utils/snake_inference.py
import torch
from torchvision import models, transforms
from PIL import Image

class SnakeClassifier:
    def __init__(self, model_path="models/snake_model.pth"):
        self.classes = ["Non Venomous", "Venomous"]

        self.model = models.mobilenet_v3_small(weights=None)
        self.model.classifier[3] = torch.nn.Linear(1024, 2)
        self.model.load_state_dict(torch.load(model_path, map_location="cpu"))
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

    def predict(self, image):
        img = self.transform(image).unsqueeze(0)
        output = self.model(img)
        probs = torch.softmax(output, dim=1)
        confidence, pred = torch.max(probs, 1)

        return {
            "prediction": self.classes[pred.item()],
            "confidence": float(confidence.item())
        }