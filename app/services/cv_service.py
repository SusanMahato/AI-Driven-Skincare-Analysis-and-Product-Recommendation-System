import io
import logging
import os
from typing import Dict
import cv2
import numpy as np
from PIL import Image
import onnxruntime as ort

logger = logging.getLogger('skincare_api')

FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)
if FACE_CASCADE.empty():
    logger.error('Failed to load Haar Cascade face detection classifier.')

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'models_weights', 'skin_model.onnx'
)

def load_model():
    if os.path.exists(MODEL_PATH):
        session = ort.InferenceSession(MODEL_PATH)
        logger.info('ONNX skin analysis model loaded successfully.')
        return session
    else:
        logger.warning('No ONNX model found at path: ' + MODEL_PATH)
        return None

session = load_model()

MIN_FACE_WIDTH_RATIO = 0.15
EDGE_MARGIN_RATIO = 0.02

def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = image.resize((224, 224))
    img_array = np.array(image).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_array = (img_array - mean) / std
    img_array = img_array.transpose(2, 0, 1)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array.astype(np.float32)

def check_face_quality(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        np_image = np.array(image)
        img_height, img_width = np_image.shape[:2]
        gray = cv2.cvtColor(np_image, cv2.COLOR_RGB2GRAY)
        min_dimension = max(60, int(min(img_width, img_height) * 0.05))
        faces = FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(min_dimension, min_dimension))
        if len(faces) == 0:
            return {'passed': False, 'issues': ['No face detected. Please upload a clear photo of your face, facing the camera directly.']}
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        face_x, face_y, face_width, face_height = largest_face
        face_width_ratio = face_width / img_width
        if face_width_ratio < MIN_FACE_WIDTH_RATIO:
            return {'passed': False, 'issues': ['Your face appears too far from the camera. Please move closer and try again.']}
        margin_x = img_width * EDGE_MARGIN_RATIO
        margin_y = img_height * EDGE_MARGIN_RATIO
        touches_edge = (face_x <= margin_x or face_y <= margin_y or (face_x + face_width) >= (img_width - margin_x) or (face_y + face_height) >= (img_height - margin_y))
        if touches_edge:
            return {'passed': False, 'issues': ['Your face appears cut off in the photo. Please center your face and try again.']}
        return {'passed': True, 'issues': []}
    except Exception:
        logger.exception('Face detection failed with an unexpected error.')
        return {'passed': False, 'issues': ['Could not process the image for face detection. Please try again.']}

def check_photo_quality(image_bytes):
    return {'passed': True, 'issues': []}

def analyze_skin(image_bytes):
    if session is None:
        logger.error('ONNX model session is not loaded.')
        return {'acne_score': 0.0, 'dark_spots_score': 0.0, 'pores_score': 0.0, 'wrinkles_score': 0.0, 'redness_score': 0.0, 'dark_circles_score': 0.0, 'photo_confidence': 0.0}
    try:
        img_array = preprocess_image(image_bytes)
        outputs = session.run(None, {'input': img_array})
        scores = outputs[0][0]
        return {'acne_score': round(float(scores[0]), 3), 'dark_spots_score': round(float(scores[1]), 3), 'pores_score': round(float(scores[2]), 3), 'wrinkles_score': round(float(scores[3]), 3), 'redness_score': round(float(scores[4]), 3), 'dark_circles_score': round(float(scores[5]), 3), 'photo_confidence': 0.97}
    except Exception as e:
        logger.error(f'Skin analysis failed: {e}')
        return {'acne_score': 0.0, 'dark_spots_score': 0.0, 'pores_score': 0.0, 'wrinkles_score': 0.0, 'redness_score': 0.0, 'dark_circles_score': 0.0, 'photo_confidence': 0.0}
