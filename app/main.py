from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from app.core.limiter import limiter
from app.api.routes import auth, quiz, weather, scan, recommendation, oauth, journal
from app.core.config import settings
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("skincare_api")

app = FastAPI(
    title="Skincare Analysis & Recommendation System",
    version="1.0.0"
)

# Rate limiting setup
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

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

# Fields whose values should never appear in server logs, even on validation failure.
SENSITIVE_FIELDS = {"password", "new_password", "otp"}


def _redact_validation_errors(errors: list) -> list:
    """Prevents sensitive field values (passwords, OTPs) from being logged in plaintext."""
    redacted = []
    for err in errors:
        err_copy = dict(err)
        loc = err_copy.get("loc", ())
        if any(field in loc for field in SENSITIVE_FIELDS):
            err_copy["input"] = "[REDACTED]"
        redacted.append(err_copy)
    return redacted


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
    so they're passed through in FastAPI's normal shape. Logged server-side
    too, but with sensitive field values (password, otp) redacted first.
    """
    safe_errors = _redact_validation_errors(exc.errors())
    logger.warning(f"Validation error on {request.method} {request.url.path}: {safe_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors()}),
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Fired when a client exceeds a rate limit on a protected endpoint
    (login, forgot-password, reset-password, scan analyze). Returned in
    the same JSON shape as every other error response in this app.
    """
    client_ip = get_remote_address(request)
    logger.warning(f"Rate limit exceeded on {request.method} {request.url.path} from {client_ip}")
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Too many requests. Please wait a moment and try again."},
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
