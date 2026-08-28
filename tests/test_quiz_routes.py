"""Integration tests for /quiz/* routes."""

VALID_QUIZ_PAYLOAD = {
    "age_range": "25-34",
    "gender": "Female",
    "skin_type": "Oily",
    "products_used_before": "Regularly",
    "sensitivity": None,
    "sun_exposure": "1-3hrs",
    "concern_one": "Acne",
    "concern_two": "Pores",
    "skin_goal": "Clear skin",
}


def test_submit_quiz_requires_authentication(client):
    response = client.post("/quiz/submit", json=VALID_QUIZ_PAYLOAD)
    assert response.status_code == 401


def test_submit_quiz_creates_profile(authed_client):
    client, user = authed_client
    response = client.post("/quiz/submit", json=VALID_QUIZ_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == user.id
    assert body["skin_type"] == "Oily"


def test_submit_quiz_twice_updates_instead_of_duplicating(authed_client):
    client, user = authed_client
    client.post("/quiz/submit", json=VALID_QUIZ_PAYLOAD)
    second_payload = dict(VALID_QUIZ_PAYLOAD, skin_type="Dry", concern_one="Dryness")
    response = client.post("/quiz/submit", json=second_payload)
    assert response.status_code == 200
    assert response.json()["skin_type"] == "Dry"

    profile_response = client.get("/quiz/profile")
    assert profile_response.json()["skin_type"] == "Dry"


def test_submit_quiz_rejects_invalid_enum_value(authed_client):
    client, _ = authed_client
    bad_payload = dict(VALID_QUIZ_PAYLOAD, skin_type="Metallic")
    response = client.post("/quiz/submit", json=bad_payload)
    assert response.status_code == 422


def test_submit_quiz_allows_omitting_optional_secondary_concern(authed_client):
    client, _ = authed_client
    payload = dict(VALID_QUIZ_PAYLOAD)
    del payload["concern_two"]
    response = client.post("/quiz/submit", json=payload)
    assert response.status_code == 200
    assert response.json()["concern_two"] is None


def test_get_profile_requires_authentication(client):
    response = client.get("/quiz/profile")
    assert response.status_code == 401


def test_get_profile_before_quiz_returns_404(authed_client):
    client, _ = authed_client
    response = client.get("/quiz/profile")
    assert response.status_code == 404


def test_get_profile_after_quiz_returns_profile(authed_client):
    client, _ = authed_client
    client.post("/quiz/submit", json=VALID_QUIZ_PAYLOAD)
    response = client.get("/quiz/profile")
    assert response.status_code == 200
    assert response.json()["concern_one"] == "Acne"
