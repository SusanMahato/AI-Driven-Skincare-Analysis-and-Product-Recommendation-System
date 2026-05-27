import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import io
from typing import Dict

# Load EfficientNet-B0 model
def load_model():
    model = models.efficientnet_b0(pretrained=False)
    # Modify final layer for our 6 skin condition outputs
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 6)
    model.eval()
    return model

model = load_model()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def analyze_skin(image_bytes: bytes) -> Dict[str, float]:
    # Open and preprocess image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = transform(image).unsqueeze(0)

    # Run inference
    with torch.no_grad():
        output = model(input_tensor)
        scores = torch.sigmoid(output).squeeze().tolist()

    return {
        "acne_score": round(scores[0], 3),
        "redness_score": round(scores[1], 3),
        "texture_score": round(scores[2], 3),
        "dark_spots_score": round(scores[3], 3),
        "pores_score": round(scores[4], 3),
        "dark_circles_score": round(scores[5], 3),
        "photo_confidence": 0.85
    }

def check_photo_quality(image_bytes: bytes) -> Dict:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = image.size

        issues = []

        # Check resolution
        if width < 200 or height < 200:
            issues.append("Image too small — please take a closer photo")

        # Check aspect ratio (face should be roughly portrait)
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