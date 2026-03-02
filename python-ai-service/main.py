"""
SylvanGuard AI Service - Bite Detection using CNN
FastAPI service for snake and monkey bite image classification
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from PIL import Image
import io
import numpy as np
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SylvanGuard AI Service",
    description="CNN-based bite detection for snake and monkey incidents",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODEL LOADING (Replace with your actual CNN model)
# ============================================================================

# TODO: Load your trained CNN model here
# Example with TensorFlow/Keras:
# from tensorflow import keras
# model = keras.models.load_model('path/to/your/model.h5')

# TODO: Load your PyTorch model:
# import torch
# model = torch.load('path/to/your/model.pth')
# model.eval()

# For now, we'll create a mock prediction function
MODEL_LOADED = False  # Set to True when real model is loaded

# Species classifications
SPECIES_MAP = {
    'snake_bite': {
        'venomous': [
            'Indian Cobra (Naja naja)',
            'Russell\'s Viper (Daboia russelii)',
            'Common Krait (Bungarus caeruleus)',
            'Saw-scaled Viper (Echis carinatus)',
        ],
        'non_venomous': [
            'Rat Snake',
            'Python',
            'Garden Snake'
        ]
    },
    'monkey_bite': [
        'Rhesus Macaque',
        'Bonnet Macaque',
        'Langur',
        'Unknown Primate'
    ]
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess image for model input
    
    Args:
        image: PIL Image object
    
    Returns:
        Preprocessed numpy array
    """
    # Resize to model input size (adjust based on your model)
    img_size = (224, 224)  # Common CNN input size
    image = image.resize(img_size)
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Convert to numpy array
    img_array = np.array(image)
    
    # Normalize pixel values (0-255 to 0-1)
    img_array = img_array.astype(np.float32) / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

def predict_bite(img_array: np.ndarray) -> dict:
    """
    Make prediction using CNN model
    
    Args:
        img_array: Preprocessed image array
    
    Returns:
        Dictionary with prediction results
    """
    if not MODEL_LOADED:
        # Mock predictions for testing
        # Replace this with actual model inference
        logger.warning("Using mock predictions - model not loaded")
        
        # Simulated prediction
        import random
        
        incident_type = random.choice(['snake_bite', 'monkey_bite'])
        confidence = round(random.uniform(0.75, 0.98), 2)
        
        if incident_type == 'snake_bite':
            is_venomous = random.choice([True, False])
            species_list = SPECIES_MAP['snake_bite']['venomous' if is_venomous else 'non_venomous']
            species = random.choice(species_list)
            severity = 'severe' if is_venomous else 'moderate'
        else:
            species = random.choice(SPECIES_MAP['monkey_bite'])
            severity = 'moderate'
        
        return {
            'prediction': incident_type,
            'confidence': confidence,
            'species': species,
            'severity': severity,
            'is_venomous': is_venomous if incident_type == 'snake_bite' else None
        }
    
    # TODO: Actual model prediction
    # Example with TensorFlow:
    # predictions = model.predict(img_array)
    # class_idx = np.argmax(predictions[0])
    # confidence = float(predictions[0][class_idx])
    
    # Example with PyTorch:
    # import torch
    # with torch.no_grad():
    #     img_tensor = torch.from_numpy(img_array)
    #     predictions = model(img_tensor)
    #     class_idx = torch.argmax(predictions).item()
    #     confidence = float(predictions[0][class_idx])
    
    pass

def get_recommendations(incident_type: str, severity: str, is_venomous: Optional[bool] = None) -> list:
    """
    Get emergency recommendations based on prediction
    
    Args:
        incident_type: Type of bite
        severity: Severity level
        is_venomous: Whether snake is venomous (for snake bites)
    
    Returns:
        List of recommendation strings
    """
    if incident_type == 'snake_bite':
        if is_venomous or severity in ['severe', 'critical']:
            return [
                '🚨 SEEK IMMEDIATE MEDICAL ATTENTION - Call 108',
                'Keep the victim calm and minimize movement',
                'Remove jewelry and tight clothing near the bite',
                'Position the bite below heart level if possible',
                'Clean the bite with soap and water',
                'Cover with a clean, dry dressing',
                'DO NOT apply ice, tourniquet, or try to suck venom',
                'Note the snake\'s appearance for medical staff'
            ]
        else:
            return [
                'Clean the wound thoroughly with soap and water',
                'Apply antiseptic',
                'Monitor for signs of allergic reaction',
                'Seek medical evaluation to confirm non-venomous',
                'Get a tetanus shot if not up to date'
            ]
    
    elif incident_type == 'monkey_bite':
        return [
            '⚠️ URGENT: Rabies prophylaxis needed within 24 hours',
            'Wash wound thoroughly with soap and water for 15 minutes',
            'Apply antiseptic solution (Betadine/alcohol)',
            'Cover with sterile bandage',
            'Seek immediate medical attention for rabies vaccination',
            'Get tetanus shot if not up to date',
            'Report the incident to local animal control',
            'Do not delay - rabies is fatal once symptoms appear'
        ]
    
    return []

def calculate_severity(confidence: float, incident_type: str, is_venomous: Optional[bool] = None) -> str:
    """
    Calculate severity level based on prediction
    
    Args:
        confidence: Model confidence score
        incident_type: Type of bite
        is_venomous: Whether snake is venomous
    
    Returns:
        Severity level string
    """
    if incident_type == 'snake_bite' and is_venomous:
        if confidence > 0.9:
            return 'critical'
        elif confidence > 0.75:
            return 'severe'
        else:
            return 'moderate'
    elif incident_type == 'monkey_bite':
        return 'severe'  # Rabies risk
    else:
        return 'moderate'

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SylvanGuard AI",
        "status": "operational",
        "version": "1.0.0",
        "model_loaded": MODEL_LOADED
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": MODEL_LOADED
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict bite type from uploaded image
    
    Args:
        file: Uploaded image file
    
    Returns:
        JSON with prediction results
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, WebP)"
            )
        
        # Read image file
        logger.info(f"Processing image: {file.filename}")
        contents = await file.read()
        
        # Open image with PIL
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )
        
        # Preprocess image
        img_array = preprocess_image(image)
        
        # Make prediction
        prediction_result = predict_bite(img_array)
        
        # Get recommendations
        recommendations = get_recommendations(
            prediction_result['prediction'],
            prediction_result['severity'],
            prediction_result.get('is_venomous')
        )
        
        # Prepare response
        response = {
            'success': True,
            'prediction': prediction_result['prediction'],
            'confidence': prediction_result['confidence'],
            'species': prediction_result['species'],
            'severity': prediction_result['severity'],
            'recommendations': recommendations,
            'details': {
                'model_version': '1.0.0',
                'image_size': image.size,
                'processed_at': str(np.datetime64('now'))
            }
        }
        
        if prediction_result['prediction'] == 'snake_bite':
            response['is_venomous'] = prediction_result.get('is_venomous', False)
        
        logger.info(f"Prediction completed: {prediction_result['prediction']} ({prediction_result['confidence']})")
        
        return JSONResponse(content=response)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/predict/batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    """
    Batch prediction for multiple images
    
    Args:
        files: List of uploaded image files
    
    Returns:
        JSON with list of prediction results
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 images per batch request"
        )
    
    results = []
    
    for file in files:
        try:
            # Process each file
            result = await predict(file)
            results.append({
                'filename': file.filename,
                'result': result
            })
        except Exception as e:
            results.append({
                'filename': file.filename,
                'error': str(e)
            })
    
    return JSONResponse(content={'results': results})

# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    global MODEL_LOADED
    
    logger.info("Starting SylvanGuard AI Service...")
    
    # TODO: Load your model here
    # try:
    #     model = load_model('path/to/model')
    #     MODEL_LOADED = True
    #     logger.info("Model loaded successfully")
    # except Exception as e:
    #     logger.error(f"Failed to load model: {e}")
    #     MODEL_LOADED = False
    
    logger.warning("Running in DEMO mode - using mock predictions")
    logger.info("AI Service ready to accept requests")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
