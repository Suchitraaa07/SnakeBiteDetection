"""
YOLOv8 Inference Pipeline for Snake Bite Detection

This script loads a trained YOLOv8 model and runs inference on snake images.
It draws bounding boxes with class labels and confidence scores.

Requirements:
    - ultralytics
    - opencv-python
    - Python 3.10+

Usage:
    python wound_inference.py <image_path> [output_path]

Example:
    python wound_inference.py data/test/images/snake_001.jpg
    python wound_inference.py data/test/images/snake_001.jpg results/output.jpg
"""

import sys
import cv2
from pathlib import Path
from ultralytics import YOLO


def load_model(model_path: str) -> YOLO:
    """
    Load a trained YOLOv8 model.
    
    Args:
        model_path: Path to the trained model (.pt file)
        
    Returns:
        Loaded YOLO model instance
        
    Raises:
        FileNotFoundError: If model file doesn't exist
    """
    model_path = Path(model_path)
    
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found at {model_path}\n"
            f"Please run training first: python train_wound_model.py"
        )
    
    print(f"Loading model from: {model_path}")
    model = YOLO(str(model_path))
    print("✓ Model loaded successfully")
    return model


def run_inference(model: YOLO, image_path: str, confidence_threshold: float = 0.1) -> dict:
    """
    Run inference on an image and return predictions.
    
    Args:
        model: Loaded YOLO model
        image_path: Path to input image
        confidence_threshold: Minimum confidence score for predictions (0-1). Lower values (0.1-0.3) for recently trained models.
        
    Returns:
        Dictionary containing:
            - 'image': Original image
            - 'results': Raw YOLO results object
            - 'detections': List of detections with box, class, confidence
            
    Raises:
        FileNotFoundError: If image file doesn't exist
        ValueError: If image cannot be read
    """
    image_path = Path(image_path)
    
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found at {image_path}")
    
    # Load image with OpenCV
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Failed to read image from {image_path}")
    
    print(f"\nRunning inference on: {image_path}")
    print(f"Image size: {image.shape}")
    
    # Run prediction
    results = model.predict(source=str(image_path), conf=confidence_threshold, verbose=False)
    
    # Extract detections
    detections = []
    if results[0].boxes is not None:
        for box in results[0].boxes:
            detection = {
                'xyxy': box.xyxy.cpu().numpy()[0],  # Bounding box coordinates
                'confidence': float(box.conf.cpu().numpy()[0]),
                'class_id': int(box.cls.cpu().numpy()[0]),
                'class_name': results[0].names[int(box.cls.cpu().numpy()[0])]
            }
            detections.append(detection)
    
    print(f"Detections found: {len(detections)}")
    
    return {
        'image': image,
        'results': results[0],
        'detections': detections
    }


def draw_detections(image, detections: list, class_names: dict) -> object:
    """
    Draw bounding boxes with class labels and confidence on image.
    
    Args:
        image: Input image (numpy array)
        detections: List of detection dictionaries
        class_names: Dictionary mapping class IDs to class names
        
    Returns:
        Image with drawn bounding boxes
    """
    annotated_image = image.copy()
    
    for detection in detections:
        xyxy = detection['xyxy']
        confidence = detection['confidence']
        class_id = detection['class_id']
        class_name = detection['class_name']
        
        # Convert coordinates to integers
        x1, y1, x2, y2 = map(int, xyxy)
        
        # Color codes: Red for Venomous, Green for Non-Venomous
        color = (0, 0, 255) if class_name == "Venomous" else (0, 255, 0)  # BGR format
        
        # Draw bounding box
        cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)
        
        # Prepare label
        label = f"{class_name}: {confidence:.2f}"
        
        # Get text size for background rectangle
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        thickness = 2
        text_size = cv2.getTextSize(label, font, font_scale, thickness)[0]
        
        # Draw background rectangle for label
        label_bg_color = color
        cv2.rectangle(
            annotated_image,
            (x1, y1 - text_size[1] - 10),
            (x1 + text_size[0], y1),
            label_bg_color,
            -1  # Filled rectangle
        )
        
        # Draw label text
        cv2.putText(
            annotated_image,
            label,
            (x1, y1 - 5),
            font,
            font_scale,
            (255, 255, 255),  # White text
            thickness
        )
    
    return annotated_image


def save_result(image, output_path: str = "output_prediction.jpg"):
    """
    Save annotated image to file.
    
    Args:
        image: Annotated image (numpy array)
        output_path: Path where to save the image
        
    Returns:
        Path to saved image
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    success = cv2.imwrite(str(output_path), image)
    
    if success:
        print(f"✓ Result saved to: {output_path.absolute()}")
        return output_path
    else:
        raise IOError(f"Failed to save image to {output_path}")


def main():
    """Main inference pipeline."""
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python wound_inference.py <image_path> [confidence_threshold] [output_path]")
        print("\nExamples:")
        print("  python wound_inference.py data/test/images/snake.jpg")
        print("  python wound_inference.py data/test/images/snake.jpg 0.2")
        print("  python wound_inference.py data/test/images/snake.jpg 0.2 results/output.jpg")
        print("\nNote: Lower confidence threshold (0.1-0.3) for recently trained models")
        sys.exit(1)
    
    image_path = sys.argv[1]
    confidence_threshold = 0.1  # Default
    output_path = "output_prediction.jpg"  # Default
    
    # Parse remaining arguments - check if they're numbers (confidence) or paths (output)
    for i in range(2, len(sys.argv)):
        try:
            # Try to parse as float (confidence threshold)
            confidence_threshold = float(sys.argv[i])
        except ValueError:
            # If not a number, treat as output path
            output_path = sys.argv[i]
    
    print("=" * 70)
    print("YOLOv8 Snake Bite Detection Inference")
    print("=" * 70)
    
    try:
        # Load model
        model = load_model("models/snake_model.pt")
        
        # Run inference
        print(f"\nUsing confidence threshold: {confidence_threshold}")
        inference_result = run_inference(model, image_path, confidence_threshold=confidence_threshold)
        
        # Draw detections
        print("\nDrawing detections...")
        annotated_image = draw_detections(
            inference_result['image'],
            inference_result['detections'],
            inference_result['results'].names
        )
        
        # Save result
        print("\nSaving result...")
        saved_path = save_result(annotated_image, output_path)
        
        # Print summary
        print("\n" + "=" * 70)
        print("Inference Complete!")
        print("=" * 70)
        print(f"Detections: {len(inference_result['detections'])}")
        
        if inference_result['detections']:
            print("\nDetailed Results:")
            for i, det in enumerate(inference_result['detections'], 1):
                print(f"  [{i}] {det['class_name']:<15} | Confidence: {det['confidence']:.4f}")
        else:
            print("\nNo detections found in image.")
        
        print("=" * 70)
        return True
        
    except FileNotFoundError as e:
        print(f"\n❌ ERROR: {e}", file=sys.stderr)
        return False
    except ValueError as e:
        print(f"\n❌ ERROR: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
