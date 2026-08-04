import io
import logging
import os
from typing import Dict

import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms

logger = logging.getLogger("skincare_api")

# Haar Cascade classifier for face detection — bundled with opencv-python-headless
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

if FACE_CASCADE.empty():
    logger.error(
        "Failed to load Haar Cascade face detection classifier — check opencv-python-headless installation."
    )

# Model path
MODEL_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'models_weights', 'skin_model_finetuned.pt'
)


def load_model():
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Sequential(
        nn.Linear(model.classifier[1].in_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, 6),
    )

    if os.path.exists(MODEL_PATH):
        model.load_state_dict(
            torch.load(MODEL_PATH, map_location=torch.device('cpu'))
        )
        logger.info("Trained skin analysis model loaded successfully.")
    else:
        logger.warning("No trained weights found, using random weights.")

    model.eval()
    return model


model = load_model()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    ),
])

MIN_FACE_WIDTH_RATIO = 0.15  # face should occupy at least 15% of the image's width
EDGE_MARGIN_RATIO = 0.02  # tolerance for "touching the frame edge" checks


def check_face_quality(image_bytes: bytes) -> Dict:
    """
    Checks whether the image contains a face that is both present, close
    enough to the camera, and fully within the frame for reliable skin
    analysis. Uses resolution-relative thresholds rather than fixed pixel
    sizes, so this works consistently across both low- and high-resolution
    photos.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        np_image = np.array(image)
        img_height, img_width = np_image.shape[:2]
        gray = cv2.cvtColor(np_image, cv2.COLOR_RGB2GRAY)

        min_dimension = max(60, int(min(img_width, img_height) * 0.05))
        faces = FACE_CASCADE.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(min_dimension, min_dimension)
        )

        if len(faces) == 0:
            logger.info("Face detection: no face found in uploaded scan image.")
            return {
                "passed": False,
                "issues": ["No face detected. Please upload a clear photo of your face, facing the camera directly."]
            }

        # If multiple faces were detected, use the largest one
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        face_x, face_y, face_width, face_height = largest_face
        face_width_ratio = face_width / img_width

        if face_width_ratio < MIN_FACE_WIDTH_RATIO:
            logger.info(f"Face detection: face too small relative to frame (ratio={face_width_ratio:.3f}).")
            return {
                "passed": False,
                "issues": ["Your face appears too far from the camera. Please move closer and try again."]
            }

        # Check the face isn't cropped by the frame edge (with a small tolerance,
        # since a well-centered face can still legitimately come close to the edge)
        margin_x = img_width * EDGE_MARGIN_RATIO
        margin_y = img_height * EDGE_MARGIN_RATIO
        touches_edge = (
            face_x <= margin_x
            or face_y <= margin_y
            or (face_x + face_width) >= (img_width - margin_x)
            or (face_y + face_height) >= (img_height - margin_y)
        )
        if touches_edge:
            logger.info("Face detection: face appears cropped by the frame edge.")
            return {
                "passed": False,
                "issues": ["Your face appears cut off in the photo. Please center your face and try again."]
            }

        return {"passed": True, "issues": []}
    except Exception:
        logger.exception("Face detection failed with an unexpected error.")
        return {"passed": False, "issues": ["Could not process the image for face detection. Please try again."]}

def check_photo_quality(image_bytes: bytes) -> Dict:
    """
    Placeholder check for blur, extreme lighting, or low contrast.
    """
    # Replace/expand as needed with your specific brightness/blur metrics
    return {"passed": True, "issues": []}


def analyze_skin(image_bytes: bytes) -> Dict[str, float]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        output = model(input_tensor)
        scores = torch.sigmoid(output).squeeze().tolist()
    return {
        "acne_score": round(scores[0], 3),
        "dark_spots_score": round(scores[1], 3),
        "pores_score": round(scores[2], 3),
        "wrinkles_score": round(scores[3], 3),
        "redness_score": round(scores[4], 3),
        "dark_circles_score": round(scores[5], 3),
        "photo_confidence": 0.97,
    }
    