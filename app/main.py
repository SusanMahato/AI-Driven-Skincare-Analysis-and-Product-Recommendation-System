from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.api.routes import auth, quiz, weather, scan, recommendation, oauth, journal
from app.core.config import settings
import os
import logging

# Basic logging setup — logs to console, which Render captures automatically
# in its deploy/service logs. No extra infrastructure needed.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("skincare_api")

app = FastAPI(
    title="Skincare Analysis & Recommendation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catches any exception not already handled elsewhere (i.e. not an
    HTTPException raised deliberately in route/service code). Logs the
    real error and stack trace server-side for debugging, but returns a
    single generic, client-safe message — never leaks internals like
    stack traces, file paths, or raw exception text to the client.
    """
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Passes through intentional HTTPExceptions (e.g. raise HTTPException(400, ...))
    exactly as the route code intended — these already carry safe, deliberate
    messages, so they're returned unchanged, not swallowed by the generic handler.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Pydantic/request validation errors (422) — these are already safe and
    useful to the client (e.g. "password must be at least 8 characters"),
    so they're passed through in FastAPI's normal shape, just logged too.
    """
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors()}),
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
app.include_router(journal.router)

@app.get("/")
def root():
    return {"message": "Skincare API is running"}
