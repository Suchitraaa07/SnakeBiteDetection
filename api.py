from fastapi import FastAPI, UploadFile, File, HTTPException
from load_models import load_models
from predict_species import predict_species
from predict_count import predict_count
from utils.image_preprocessing import read_image_from_bytes

app = FastAPI(title="Snake Detection API")


@app.get("/health")
def health():
    return {"status": "ok", "message": "service running"}

# load models at startup
try:
    species_model, count_model = load_models()
except Exception as e:
    # allow FastAPI to start but log error; endpoints will raise errors if models missing
    species_model = None
    count_model = None
    print(f"Failed to load models: {e}")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if species_model is None:
        raise HTTPException(status_code=500, detail="Species model not loaded")

    contents = await file.read()
    try:
        image = read_image_from_bytes(contents)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image uploaded")

    # run each prediction
    species_result = predict_species(image, species_model)
    if count_model is not None:
        count = predict_count(image, count_model)
    else:
        # Fallback when count model is missing – assume at least one snake
        count = 1

    response = {
        "snake_detected": species_result["snake_detected"],
        "species": species_result["species"],
        "confidence": species_result["confidence"],
        "snake_count": count,
    }
    return response


if __name__ == "__main__":
    import uvicorn

    # convenience entrypoint when running directly
    uvicorn.run(app, host="0.0.0.0", port=8000)
