"""
Integration tests for /recommendation/* routes.

`generate_skin_report` (Groq LLM call) is always mocked — must never hit
the network in tests. `ingredient_engine` / `product_engine` are mocked
in the /recommendation/products tests because `Ingredient`/`Product` use
PostgreSQL ARRAY columns that this SQLite test DB does not create tables
for (see conftest.py and README_TESTING.md).
"""
from unittest.mock import patch

from app.api.routes import recommendation as rec_route
from app.api.routes.quiz import router as quiz_router  # noqa: F401 (ensures quiz routes registered)
from tests.conftest import client, read_fixture_bytes
from tests.test_scan_routes import patched_scan_deps

QUIZ_PAYLOAD = {
    "age_range": "25-34", "gender": "Female", "skin_type": "Oily",
    "products_used_before": "Regularly", "sensitivity": None,
    "sun_exposure": "1-3hrs", "concern_one": "Acne", "concern_two": "Pores",
    "skin_goal": "Clear skin",
}


def complete_a_scan(client):
    good_bytes = read_fixture_bytes("sample_face.jpg")
    with patched_scan_deps():
        return client.post("/scan/analyze", files={"file": ("f.jpg", good_bytes, "image/jpeg")}).json()


# ---------------------------------------------------------------------------
# GET /recommendation/latest
# ---------------------------------------------------------------------------

def test_latest_requires_authentication(client):
    response = client.get("/recommendation/latest")
    assert response.status_code == 401


def test_latest_without_any_scan_returns_404(authed_client):
    client, _ = authed_client
    client.post("/quiz/submit", json=QUIZ_PAYLOAD)
    response = client.get("/recommendation/latest")
    assert response.status_code == 404
    assert "scan" in response.json()["detail"].lower()


def test_latest_without_quiz_profile_returns_404(authed_client):
    client, _ = authed_client
    complete_a_scan(client)
    response = client.get("/recommendation/latest")
    assert response.status_code == 404
    assert "quiz" in response.json()["detail"].lower()


def test_latest_success_after_scan_and_quiz(authed_client):
    client, _ = authed_client
    client.post("/quiz/submit", json=QUIZ_PAYLOAD)
    complete_a_scan(client)

    with patch.object(rec_route, "generate_skin_report", return_value="Personalized report text."), \
     patch.object(rec_route, "ingredient_engine", return_value={"morning": [], "night": [], "conflict_warnings": []}):
     response = client.get("/recommendation/latest")
    
    assert response.status_code == 200
    body = response.json()
    assert body["skin_report"] == "Personalized report text."
    assert isinstance(body["ingredients"], list)
    assert body["recommended_spf"] in (30, 40, 50)
    assert "SPF" in body["morning_routine"][-1]


# ---------------------------------------------------------------------------
# GET /recommendation/products
# ---------------------------------------------------------------------------

def test_products_requires_authentication(client):
    response = client.get("/recommendation/products")
    assert response.status_code == 401


def test_products_without_scan_returns_404(authed_client):
    client, _ = authed_client
    client.post("/quiz/submit", json=QUIZ_PAYLOAD)
    response = client.get("/recommendation/products")
    assert response.status_code == 404


def test_products_success_returns_engine_output(authed_client):
    client, _ = authed_client
    client.post("/quiz/submit", json=QUIZ_PAYLOAD)
    complete_a_scan(client)

    fake_ingredients = {"morning": [], "night": [], "conflict_warnings": []}
    fake_products = {
        "best_match": {"morning": {}, "night": {}},
        "budget_picks": {"morning": {}, "night": {}},
        "premium": {"morning": {}, "night": {}},
    }
    with patch.object(rec_route, "ingredient_engine", return_value=fake_ingredients), \
         patch.object(rec_route, "product_engine", return_value=fake_products):
        response = client.get("/recommendation/products")

    assert response.status_code == 200
    body = response.json()
    assert body["ingredients"] == fake_ingredients
    assert body["products"] == fake_products
