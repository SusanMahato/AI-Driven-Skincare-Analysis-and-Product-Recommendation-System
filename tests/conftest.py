"""
Shared pytest fixtures for the Skincare AI backend test suite.

Design notes
------------
- `User`, `SkinProfile`, `Scan`, and `JournalEntry` are created in a real
  SQLite in-memory database, so tests exercise real SQLAlchemy queries.
- `Ingredient` and `Product` use PostgreSQL's ARRAY column type, which
  SQLite cannot create tables for. Those two tables are deliberately left
  out of `create_all()`. Route tests that touch the recommendation engine
  (`/recommendation/products`) instead monkeypatch `ingredient_engine`
  and `product_engine`, since they are unit-tested directly against fake
  in-memory objects in `test_recommendation_service.py`. See README_TESTING.md
  for how to run the recommendation engine against a real Postgres test DB.
- All dependency overrides are cleared after every test to avoid leaking
  state between tests.
"""
import io
import os
import sys
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

# Make sure "app" is importable when pytest is run from the project root.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base, get_db  # noqa: E402
from app.core.dependencies import get_current_user  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.skin_profile import SkinProfile  # noqa: E402
from app.models.scan import Scan  # noqa: E402
from app.models.journal_entry import JournalEntry  # noqa: E402
from app.services.auth_service import hash_password  # noqa: E402


@pytest.fixture()
def db_session():
    """A fresh in-memory SQLite session per test (User/SkinProfile/Scan/Journal only)."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        bind=engine,
        tables=[
            User.__table__,
            SkinProfile.__table__,
            Scan.__table__,
            JournalEntry.__table__,
        ],
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient wired to the SQLite test DB via dependency override."""

    def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    # Rate-limit counters live in the shared `limiter` instance imported by
    # main.py, which persists across tests in the same pytest session
    # (the FastAPI `app` object is only created once). Reset it before every
    # test so login-attempt/OTP-attempt counts from one test never bleed
    # into the next.
    if hasattr(app.state, "limiter"):
        app.state.limiter.reset()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_user(db_session, email="user@example.com", password="StrongPass123",
              is_verified=True, full_name="Test User"):
    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        is_verified=is_verified,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def verified_user(db_session):
    return make_user(db_session, email="verified@example.com", is_verified=True)


@pytest.fixture()
def unverified_user(db_session):
    return make_user(db_session, email="unverified@example.com", is_verified=False)


@pytest.fixture()
def authed_client(client, verified_user):
    """A TestClient that is already authenticated as `verified_user`,
    via a `get_current_user` dependency override (bypasses real JWT
    decoding so tests don't depend on SECRET_KEY/.env contents)."""

    app.dependency_overrides[get_current_user] = lambda: verified_user
    yield client, verified_user
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]


def read_fixture_bytes(filename: str) -> bytes:
    with open(os.path.join(FIXTURES_DIR, filename), "rb") as f:
        return f.read()
