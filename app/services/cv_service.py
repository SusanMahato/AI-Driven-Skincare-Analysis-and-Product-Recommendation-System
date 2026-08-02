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
from torchvision.models import EfficientNet_B0_Weights

logger = logging.getLogger("skincare_api")

# Haar Cascade classifier for face detection — bundled with opencv-python-headless,
# no separate download or training needed.
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


def detect_face(image_bytes: bytes) -> bool:
    """Returns True if at least one face is detected in the image, False otherwise.

    Acts as a sanity check before running skin analysis, rejecting non-face
    images (documents, objects, etc.) that would otherwise pass file validation
    but produce meaningless analysis results.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        np_image = np.array(image)
        gray = cv2.cvtColor(np_image, cv2.COLOR_RGB2GRAY)
        faces = FACE_CASCADE.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )
        face_found = len(faces) > 0
        if not face_found:
            logger.info("Face detection: no face found in uploaded scan image.")
        return face_found
    except Exception:
        logger.exception("Face detection failed with an unexpected error.")
        return False


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


def check_photo_quality(image_bytes: bytes) -> Dict:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = image.size

        issues = []

        if width < 200 or height < 200:
            issues.append("Image too small — please take a closer photo")

        aspect_ratio = width / height
        if aspect_ratio > 1.5:
            issues.append("Image too wide — please use portrait orientation")

        return {"passed": len(issues) == 0, "issues": issues}
    except Exception:
        logger.exception("Photo quality check failed with an unexpected error.")
        return {
            "passed": False,
            "issues": ["Could not read image — please try again"],
        }
        