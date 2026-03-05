import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader

print("🚀 Script started")

DATA_DIR = "data/snake-dataset-india/train"
MODEL_PATH = "models/snake_model.pth"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

print("📂 Loading dataset...")

dataset = datasets.ImageFolder(DATA_DIR, transform=transform)

print("✅ Dataset loaded")
print("Classes:", dataset.classes)
print("Total images:", len(dataset))

loader = DataLoader(dataset, batch_size=16, shuffle=True)

print("🤖 Loading model...")

model = models.mobilenet_v3_small(pretrained=True)
model.classifier[3] = nn.Linear(1024, 2)

device = torch.device("cpu")
model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001)

print("🏋️ Starting training...")

for epoch in range(3):
    running_loss = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {running_loss:.4f}")

print("💾 Saving model...")

torch.save(model.state_dict(), MODEL_PATH)

print("✅ Model saved successfully!")