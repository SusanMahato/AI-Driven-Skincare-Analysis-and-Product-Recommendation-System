from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import auth, quiz, weather, scan, recommendation, oauth
import os

app = FastAPI(
    title="Skincare Analysis & Recommendation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploaded_scans')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploaded_scans", StaticFiles(directory=UPLOAD_DIR), name="uploaded_scans")

app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(weather.router)
app.include_router(scan.router)
app.include_router(recommendation.router)
app.include_router(oauth.router)

@app.get("/")
def root():
    return {"message": "Skincare API is running"}