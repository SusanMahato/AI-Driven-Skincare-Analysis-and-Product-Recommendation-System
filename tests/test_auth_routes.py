"""
Integration tests for /auth/* routes, using FastAPI's TestClient against
an in-memory SQLite database. Outbound email (Resend) is always mocked —
these tests must never attempt a real network call.
"""
from unittest.mock import patch

import pytest

from tests.conftest import make_user


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@patch("app.services.auth_service.send_verification_email")
def test_register_success_returns_201_like_response(mock_email, client):
    response = client.post("/auth/register", json={
        "full_name": "Alice Example",
        "email": "alice@gmail.com",
        "password": "StrongPass123",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "alice@gmail.com"
    assert body["is_verified"] is False
    assert "hashed_password" not in body  # UserResponse must not leak the hash


@patch("app.services.auth_service.send_verification_email")
def test_register_duplicate_email_returns_400(mock_email, client, db_session):
    make_user(db_session, email="dup@gmail.com")
    response = client.post("/auth/register", json={
        "full_name": "Someone Else",
        "email": "dup@gmail.com",
        "password": "StrongPass123",
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.parametrize("password", ["short1", "a" * 73, ""])
def test_register_rejects_invalid_password_length(client, password):
    response = client.post("/auth/register", json={
        "full_name": "Bob Example",
        "email": "bob@example.com",
        "password": password,
    })
    assert response.status_code == 422


def test_register_rejects_invalid_email_format(client):
    response = client.post("/auth/register", json={
        "full_name": "Bob Example",
        "email": "not-an-email",
        "password": "StrongPass123",
    })
    assert response.status_code == 422


def test_register_rejects_missing_full_name(client):
    response = client.post("/auth/register", json={
        "email": "bob2@example.com",
        "password": "StrongPass123",
    })
    assert response.status_code == 422




# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

def test_login_success_returns_bearer_token(client, db_session):
    make_user(db_session, email="login@example.com", password="StrongPass123", is_verified=True)
    response = client.post("/auth/login", data={
        "username": "login@example.com", "password": "StrongPass123",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 20


def test_login_wrong_password_returns_401(client, db_session):
    make_user(db_session, email="login2@example.com", password="StrongPass123", is_verified=True)
    response = client.post("/auth/login", data={
        "username": "login2@example.com", "password": "WrongPassword",
    })
    assert response.status_code == 401


def test_login_unknown_email_returns_401(client):
    response = client.post("/auth/login", data={
        "username": "nobody@example.com", "password": "whatever",
    })
    assert response.status_code == 401


def test_login_unverified_user_returns_403(client, db_session):
    make_user(db_session, email="unverified2@example.com", password="StrongPass123", is_verified=False)
    response = client.post("/auth/login", data={
        "username": "unverified2@example.com", "password": "StrongPass123",
    })
    assert response.status_code == 403


def test_login_is_rate_limited_after_five_attempts_per_minute(client, db_session):
    make_user(db_session, email="ratelimited@example.com", password="StrongPass123", is_verified=True)
    for _ in range(5):
        r = client.post("/auth/login", data={
            "username": "ratelimited@example.com", "password": "WrongPassword",
        })
        assert r.status_code == 401
    sixth = client.post("/auth/login", data={
        "username": "ratelimited@example.com", "password": "WrongPassword",
    })
    assert sixth.status_code == 429


# ---------------------------------------------------------------------------
# GET /auth/verify-email
# ---------------------------------------------------------------------------

def test_verify_email_with_valid_token(client, db_session):
    user = make_user(db_session, email="toverify@example.com", is_verified=False)
    user.verification_token = "validtoken123"
    db_session.commit()

    response = client.get("/auth/verify-email", params={"token": "validtoken123"})
    assert response.status_code == 200
    assert "verified" in response.json()["message"].lower()


def test_verify_email_with_invalid_token_returns_400(client):
    response = client.get("/auth/verify-email", params={"token": "garbage-token"})
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# POST /auth/forgot-password and /auth/reset-password
# ---------------------------------------------------------------------------

@patch("app.services.email_service.send_password_reset_email")
def test_forgot_password_known_email_returns_generic_message(mock_email, client, db_session):
    make_user(db_session, email="forgot@example.com")
    response = client.post("/auth/forgot-password", json={"email": "forgot@example.com"})
    assert response.status_code == 200
    mock_email.assert_called_once()


def test_forgot_password_unknown_email_still_returns_200(client):
    """Must not reveal whether the email exists — same response either way."""
    response = client.post("/auth/forgot-password", json={"email": "ghost@example.com"})
    assert response.status_code == 200
    assert "if this email exists" in response.json()["message"].lower()


@patch("app.services.email_service.send_password_reset_email")
def test_reset_password_full_flow(mock_email, client, db_session):
    from app.services import auth_service

    make_user(db_session, email="fullflow@example.com", password="OldPassword1")
    otp = auth_service.create_password_reset_otp(db_session, "fullflow@example.com")

    response = client.post("/auth/reset-password", json={
        "email": "fullflow@example.com",
        "otp": otp,
        "new_password": "NewPassword1",
    })
    assert response.status_code == 200

    login_response = client.post("/auth/login", data={
        "username": "fullflow@example.com", "password": "NewPassword1",
    })
    assert login_response.status_code == 200


def test_reset_password_wrong_otp_returns_400(client, db_session):
    make_user(db_session, email="wrongotp@example.com", password="OldPassword1")
    response = client.post("/auth/reset-password", json={
        "email": "wrongotp@example.com",
        "otp": "000000",
        "new_password": "NewPassword1",
    })
    assert response.status_code == 400


def test_reset_password_rejects_weak_new_password(client, db_session):
    make_user(db_session, email="weaknew@example.com", password="OldPassword1")
    response = client.post("/auth/reset-password", json={
        "email": "weaknew@example.com",
        "otp": "123456",
        "new_password": "weak",
    })
    assert response.status_code == 422



