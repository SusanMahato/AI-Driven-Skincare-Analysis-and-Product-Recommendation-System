import torch
import torchvision.transforms as transforms
import torchvision.models as models
from torchvision.models import EfficientNet_B0_Weights
import torch.nn as nn
from PIL import Image
import io
from typing import Dict
import os

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models_weights', 'skin_model.pt')

def load_model():
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Sequential(
        nn.Linear(model.classifier[1].in_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, 6),
        nn.Sigmoid()
    )
    
    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
        print("✅ Trained model loaded successfully!")
    else:
        print("⚠️ No trained weights found, using random weights")
    
    model.eval()
    return model

model = load_model()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def analyze_skin(image_bytes: bytes) -> Dict[str, float]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        output = model(input_tensor)
        scores = output.squeeze().tolist()

    return {
        "acne_score": round(scores[0], 3),
        "redness_score": round(scores[1], 3),
        "texture_score": round(scores[2], 3),
        "dark_spots_score": round(scores[3], 3),
        "pores_score": round(scores[4], 3),
        "dark_circles_score": round(scores[5], 3),
        "photo_confidence": 0.97
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

        return {
            "passed": len(issues) == 0,
            "issues": issues
        }
    except Exception:
        return {
            "passed": False,
            "issues": ["Could not read image — please try again"]
        }