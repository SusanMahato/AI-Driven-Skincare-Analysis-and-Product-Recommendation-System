from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, quiz, weather, scan, recommendation, oauth

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

app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(weather.router)
app.include_router(scan.router)
app.include_router(recommendation.router)
app.include_router(oauth.router)

@app.get("/")
def root():
    return {"message": "Skincare API is running"}