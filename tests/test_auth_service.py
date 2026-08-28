"""
Unit tests for app/services/auth_service.py

These exercise the pure/DB-backed business logic directly (no HTTP layer),
so failures here point straight at the function responsible.
"""
import time
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from jose import jwt

from app.core.config import settings
from app.services import auth_service
from app.schemas.auth import UserRegister
from tests.conftest import make_user


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def test_hash_password_produces_different_hash_than_plaintext():
    hashed = auth_service.hash_password("MySecret123")
    assert hashed != "MySecret123"
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")


def test_verify_password_correct():
    hashed = auth_service.hash_password("MySecret123")
    assert auth_service.verify_password("MySecret123", hashed) is True


def test_verify_password_incorrect():
    hashed = auth_service.hash_password("MySecret123")
    assert auth_service.verify_password("WrongPassword", hashed) is False


def test_hash_password_is_salted_and_nondeterministic():
    h1 = auth_service.hash_password("SamePassword1")
    h2 = auth_service.hash_password("SamePassword1")
    assert h1 != h2  # bcrypt salts each hash uniquely
    assert auth_service.verify_password("SamePassword1", h1)
    assert auth_service.verify_password("SamePassword1", h2)


# ---------------------------------------------------------------------------
# get_user_by_email / create_user
# ---------------------------------------------------------------------------

def test_get_user_by_email_found(db_session):
    user = make_user(db_session, email="findme@example.com")
    found = auth_service.get_user_by_email(db_session, "findme@example.com")
    assert found is not None
    assert found.id == user.id


def test_get_user_by_email_not_found(db_session):
    found = auth_service.get_user_by_email(db_session, "nobody@example.com")
    assert found is None


@patch("app.services.auth_service.send_verification_email")
def test_create_user_hashes_password_and_sets_unverified(mock_send_email, db_session):
    payload = UserRegister(full_name="Jane Doe", email="jane@gmail.com", password="StrongPass123")
    user = auth_service.create_user(db_session, payload)

    assert user.id is not None
    assert user.email == "jane@gmail.com"
    assert user.is_verified is False
    assert user.hashed_password != "StrongPass123"
    assert user.verification_token is not None
    mock_send_email.assert_called_once()


@patch("app.services.auth_service.send_verification_email", side_effect=Exception("SMTP down"))
def test_create_user_still_succeeds_if_email_sending_fails(mock_send_email, db_session):
    """Registration should not fail just because the verification email
    provider (Resend) is unreachable — the user account must still exist."""
    payload = UserRegister(full_name="Jane Doe", email="jane2@gmail.com", password="StrongPass123")
    user = auth_service.create_user(db_session, payload)
    assert user.id is not None
    assert user.is_verified is False


# ---------------------------------------------------------------------------
# JWT access tokens
# ---------------------------------------------------------------------------

def test_create_access_token_contains_expected_claims():
    token = auth_service.create_access_token({"sub": "user@example.com"})
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "user@example.com"
    assert "exp" in decoded


def test_create_access_token_expires_in_the_future():
    token = auth_service.create_access_token({"sub": "user@example.com"})
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    exp = datetime.utcfromtimestamp(decoded["exp"])
    assert exp > datetime.utcnow()


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

def test_verify_email_token_valid(db_session):
    user = make_user(db_session, email="verify@example.com", is_verified=False)
    user.verification_token = "sometoken123"
    db_session.commit()

    result = auth_service.verify_email_token(db_session, "sometoken123")
    assert result is not None
    assert result.is_verified is True
    assert result.verification_token is None


def test_verify_email_token_invalid_returns_none(db_session):
    result = auth_service.verify_email_token(db_session, "does-not-exist")
    assert result is None


# ---------------------------------------------------------------------------
# OTP-based password reset
# ---------------------------------------------------------------------------

def test_generate_otp_is_six_digits():
    otp = auth_service.generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()


@patch("app.services.email_service.send_password_reset_email")
def test_create_password_reset_otp_for_existing_user(mock_send_email, db_session):
    make_user(db_session, email="reset@example.com")
    otp = auth_service.create_password_reset_otp(db_session, "reset@example.com")
    assert otp is not None
    assert len(otp) == 6
    mock_send_email.assert_called_once()


def test_create_password_reset_otp_for_unknown_user_returns_none(db_session):
    """Should not reveal whether an email is registered (enumeration protection)."""
    otp = auth_service.create_password_reset_otp(db_session, "unknown@example.com")
    assert otp is None


@patch("app.services.email_service.send_password_reset_email")
def test_reset_password_with_valid_otp(mock_send_email, db_session):
    user = make_user(db_session, email="reset2@example.com", password="OldPassword1")
    otp = auth_service.create_password_reset_otp(db_session, "reset2@example.com")

    success = auth_service.reset_password_with_otp(db_session, "reset2@example.com", otp, "NewPassword1")
    assert success is True

    db_session.refresh(user)
    assert auth_service.verify_password("NewPassword1", user.hashed_password)
    assert user.reset_otp is None


@patch("app.services.email_service.send_password_reset_email")
def test_reset_password_with_wrong_otp_fails(mock_send_email, db_session):
    make_user(db_session, email="reset3@example.com", password="OldPassword1")
    auth_service.create_password_reset_otp(db_session, "reset3@example.com")

    success = auth_service.reset_password_with_otp(db_session, "reset3@example.com", "000000", "NewPassword1")
    assert success is False


def test_reset_password_for_unknown_email_fails(db_session):
    success = auth_service.reset_password_with_otp(db_session, "ghost@example.com", "123456", "NewPassword1")
    assert success is False


@patch("app.services.email_service.send_password_reset_email")
def test_reset_password_with_expired_otp_fails(mock_send_email, db_session):
    user = make_user(db_session, email="reset4@example.com", password="OldPassword1")
    otp = auth_service.create_password_reset_otp(db_session, "reset4@example.com")

    # Force the OTP to look expired (issued 20 minutes ago; OTPs are valid for 10).
    user.reset_otp_expires = datetime.utcnow() - timedelta(minutes=20)
    db_session.commit()

    success = auth_service.reset_password_with_otp(db_session, "reset4@example.com", otp, "NewPassword1")
    assert success is False


