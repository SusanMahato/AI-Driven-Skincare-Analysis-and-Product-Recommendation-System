from fastapi import FastAPI
from app.api.routes import auth, quiz, weather, scan

app = FastAPI(
    title="Skincare Analysis & Recommendation System",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(weather.router)
app.include_router(scan.router)

@app.get("/")
def root():
    return {"message": "Skincare API is running"}