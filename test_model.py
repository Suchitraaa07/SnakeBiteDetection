from utils.snake_inference import SnakeClassifier
from PIL import Image

clf = SnakeClassifier()                       # loads models/snake_model.pth
img = Image.open(r"C:\Users\Suchitra\Downloads\snakieeeeeee.jpg").convert("RGB")
print(clf.predict(img))