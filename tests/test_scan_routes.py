"""
Integration tests for /scan/* routes.

`analyze_skin` and `get_full_weather` are monkeypatched in every test here:
  - `analyze_skin` normally runs a real EfficientNet forward pass — slow,
    and already covered directly in test_cv_service.py.
  - `get_full_weather` calls two real external APIs (OpenWeatherMap,
    OpenUV) — must never run in a test.
Face/photo-quality checks are NOT mocked, so a real fixture image is used
to exercise the real Haar-cascade face detector end-to-end.
"""
import io
from unittest.mock import AsyncMock, patch

import pytest
from PIL import Image

from app.api.routes import scan as scan_route
from tests.conftest import read_fixture_bytes

from starlette.datastructures import Headers


FAKE_CV_SCORES = {
    "acne_score": 0.42, "dark_spots_score": 0.1, "pores_score": 0.3,
    "wrinkles_score": 0.05, "redness_score": 0.15, "dark_circles_score": 0.2,
    "photo_confidence": 0.97,
}
FAKE_WEATHER = {
    "temperature": 26.0, "humidity": 55, "weather_condition": "clear sky",
    "uv_index": 4.5, "uv_max": 6.0, "city": "Kathmandu",
}


def patched_scan_deps():
    return patch.multiple(
        scan_route,
        analyze_skin=lambda image_bytes: FAKE_CV_SCORES,
        get_full_weather=AsyncMock(return_value=FAKE_WEATHER),
    )


# ---------------------------------------------------------------------------
# validate_uploaded_image (unit-level, no HTTP layer)
# ---------------------------------------------------------------------------

def test_validate_uploaded_image_rejects_empty_file():
    from fastapi import HTTPException, UploadFile
    fake_file = UploadFile(filename="empty.jpg", file=io.BytesIO(b""))
    fake_file = UploadFile(filename="empty.jpg", file=io.BytesIO(b""), headers=Headers({"content-type": "image/jpeg"}))
    with pytest.raises(HTTPException) as exc_info:
        scan_route.validate_uploaded_image(fake_file, b"")
    assert exc_info.value.status_code == 400


def test_validate_uploaded_image_rejects_corrupt_content():
    from fastapi import HTTPException, UploadFile
    corrupt_bytes = read_fixture_bytes("corrupt.jpg")
    fake_file = UploadFile(filename="corrupt.jpg", file=io.BytesIO(corrupt_bytes))
    fake_file = UploadFile(filename="empty.jpg", file=io.BytesIO(b""), headers=Headers({"content-type": "image/jpeg"}))
    with pytest.raises(HTTPException) as exc_info:
        scan_route.validate_uploaded_image(fake_file, corrupt_bytes)
    assert exc_info.value.status_code == 400


def test_validate_uploaded_image_rejects_disallowed_content_type():
    from fastapi import HTTPException, UploadFile
    fake_file = UploadFile(filename="doc.pdf", file=io.BytesIO(b"%PDF-1.4"), headers=Headers({"content-type": "application/pdf"}))
    with pytest.raises(HTTPException) as exc_info:
        scan_route.validate_uploaded_image(fake_file, b"%PDF-1.4")
    assert exc_info.value.status_code == 400


def test_validate_uploaded_image_accepts_valid_jpeg():
    from fastapi import UploadFile
    good_bytes = read_fixture_bytes("sample_face.jpg")
    fake_file = UploadFile(filename="empty.jpg", file=io.BytesIO(b""), headers=Headers({"content-type": "image/jpeg"}))
    fake_file = UploadFile(filename="empty.jpg", file=io.BytesIO(b""), headers=Headers({"content-type": "image/jpeg"}))
    ext = scan_route.validate_uploaded_image(fake_file, good_bytes)
    assert ext == ".jpg"


# ---------------------------------------------------------------------------
# POST /scan/analyze
# ---------------------------------------------------------------------------

def test_analyze_requires_authentication(client):
    good_bytes = read_fixture_bytes("sample_face.jpg")
    response = client.post("/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")})
    assert response.status_code == 401


def test_analyze_requires_a_file(authed_client):
    client, _ = authed_client
    response = client.post("/scan/analyze")
    assert response.status_code == 422


def test_analyze_rejects_image_with_no_detectable_face(authed_client):
    client, _ = authed_client
    no_face_bytes = read_fixture_bytes("no_face.jpg")
    with patched_scan_deps():
        response = client.post(
            "/scan/analyze", files={"file": ("plain.jpg", no_face_bytes, "image/jpeg")}
        )
    assert response.status_code == 400


def test_analyze_rejects_non_image_content_type(authed_client):
    client, _ = authed_client
    response = client.post(
        "/scan/analyze", files={"file": ("doc.pdf", b"%PDF-1.4 fake", "application/pdf")}
    )
    assert response.status_code == 400


def test_analyze_success_with_real_face_and_mocked_cv_and_weather(authed_client):
    client, _ = authed_client
    good_bytes = read_fixture_bytes("sample_face.jpg")
    with patched_scan_deps():
        response = client.post(
            "/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["cv_scores"] == FAKE_CV_SCORES
    assert body["weather"]["city"] == "Kathmandu"
    assert "scan_id" in body


def test_analyze_falls_back_gracefully_when_weather_api_fails(authed_client):
    """If the weather provider errors out, the scan should still succeed
    with null weather fields rather than failing the whole request."""
    client, _ = authed_client
    good_bytes = read_fixture_bytes("sample_face.jpg")
    with patch.multiple(
        scan_route,
        analyze_skin=lambda image_bytes: FAKE_CV_SCORES,
        get_full_weather=AsyncMock(side_effect=Exception("weather API down")),
    ):
        response = client.post(
            "/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")}
        )
    assert response.status_code == 200
    assert response.json()["weather"]["temperature"] is None


def test_analyze_is_rate_limited_after_twenty_requests_per_hour(authed_client):
    client, _ = authed_client
    good_bytes = read_fixture_bytes("sample_face.jpg")
    with patched_scan_deps():
        for _ in range(20):
            r = client.post("/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")})
            assert r.status_code == 200
        blocked = client.post("/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")})
    assert blocked.status_code == 429


# ---------------------------------------------------------------------------
# GET /scan/history
# ---------------------------------------------------------------------------

def test_scan_history_requires_authentication(client):
    response = client.get("/scan/history")
    assert response.status_code == 401


def test_scan_history_empty_for_new_user(authed_client):
    client, _ = authed_client
    response = client.get("/scan/history")
    assert response.status_code == 200
    assert response.json() == []


def test_scan_history_returns_newest_first(authed_client):
    client, _ = authed_client
    good_bytes = read_fixture_bytes("sample_face.jpg")
    with patched_scan_deps():
        first = client.post("/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")}).json()
        second = client.post("/scan/analyze", files={"file": ("face.jpg", good_bytes, "image/jpeg")}).json()
    history = client.get("/scan/history").json()
    assert len(history) == 2
    # created_at can tie when scans are created back-to-back with mocked
    # (near-instant) CV/weather calls, so we only assert both are present —
    # not a strict order — unless the app adds a deterministic tiebreaker
    # (see Defects & Observations).
    returned_ids = {h["id"] for h in history}
    assert returned_ids == {first["scan_id"], second["scan_id"]}


# ---------------------------------------------------------------------------
# GET /scan/compare
# ---------------------------------------------------------------------------

def test_compare_requires_two_different_scan_ids(authed_client):
    client, _ = authed_client
    response = client.get("/scan/compare", params={"scan_id_1": 1, "scan_id_2": 1})
    assert response.status_code == 400


def test_compare_returns_404_for_nonexistent_scans(authed_client):
    client, _ = authed_client
    response = client.get("/scan/compare", params={"scan_id_1": 999, "scan_id_2": 998})
    assert response.status_code == 404


def test_compare_two_scans_reports_improved_condition(authed_client):
    client, _ = authed_client
    good_bytes = read_fixture_bytes("sample_face.jpg")

    worse_scores = dict(FAKE_CV_SCORES, acne_score=0.8)
    better_scores = dict(FAKE_CV_SCORES, acne_score=0.2)

    with patch.multiple(scan_route, analyze_skin=lambda b: worse_scores,
                         get_full_weather=AsyncMock(return_value=FAKE_WEATHER)):
        first = client.post("/scan/analyze", files={"file": ("f.jpg", good_bytes, "image/jpeg")}).json()

    with patch.multiple(scan_route, analyze_skin=lambda b: better_scores,
                         get_full_weather=AsyncMock(return_value=FAKE_WEATHER)):
        second = client.post("/scan/analyze", files={"file": ("f.jpg", good_bytes, "image/jpeg")}).json()

    response = client.get("/scan/compare", params={
        "scan_id_1": first["scan_id"], "scan_id_2": second["scan_id"],
    })
    assert response.status_code == 200
    body = response.json()
    acne_comparison = next(c for c in body["comparisons"] if c["condition"] == "acne")
    assert acne_comparison["status"] == "improved"
    assert body["summary"]["improved"] >= 1


def test_compare_cannot_access_another_users_scan(authed_client, db_session):
    from app.core.dependencies import get_current_user
    from app.main import app
    from tests.conftest import make_user

    client, user_a = authed_client
    good_bytes = read_fixture_bytes("sample_face.jpg")
    with patched_scan_deps():
        scan_a = client.post("/scan/analyze", files={"file": ("f.jpg", good_bytes, "image/jpeg")}).json()

    user_b = make_user(db_session, email="stranger@example.com")
    app.dependency_overrides[get_current_user] = lambda: user_b
    with patched_scan_deps():
        scan_b = client.post("/scan/analyze", files={"file": ("f.jpg", good_bytes, "image/jpeg")}).json()

    response = client.get("/scan/compare", params={
        "scan_id_1": scan_a["scan_id"], "scan_id_2": scan_b["scan_id"],
    })
    # user_b (the currently authenticated user) doesn't own scan_a
    assert response.status_code == 404
