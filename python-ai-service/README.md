# SylvanGuard Python AI Service

CNN-based image classification service for snake and monkey bite detection.

## Setup

1. Create virtual environment:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Unix/MacOS
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Train or load your CNN model:
   - Place your trained model file in this directory
   - Update the model loading code in `main.py`

4. Start the service:

```bash
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /predict` - Single image prediction
- `POST /predict/batch` - Batch prediction (max 10 images)

## Testing

Test the API with curl:

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_image.jpg"
```

## Model Requirements

The CNN model should:

- Accept 224x224 RGB images (or update preprocessing)
- Output classification: snake_bite, monkey_bite
- Provide confidence scores
- Optionally identify species

## Notes

- Currently running in DEMO mode with mock predictions
- Replace mock prediction logic with your trained model
- Adjust image preprocessing based on your model's requirements
- Consider adding model versioning and A/B testing
