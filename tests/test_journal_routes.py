"""Integration tests for /journal/* routes."""
from datetime import date, datetime, timedelta

from app.models.scan import Scan


def make_scan(db_session, user_id, created_at, acne_score):
    scan = Scan(
        user_id=user_id,
        scan_type="full",
        acne_score=acne_score,
        redness_score=0.2,
        wrinkles_score=0.1,
        dark_spots_score=0.1,
        pores_score=0.1,
        dark_circles_score=0.1,
        photo_confidence=0.97,
        created_at=created_at,
    )
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)
    return scan


# ---------------------------------------------------------------------------
# POST /journal/entry
# ---------------------------------------------------------------------------

def test_upsert_journal_entry_requires_authentication(client):
    response = client.post("/journal/entry", json={"date": "2026-01-01", "sleep_hours": 7})
    assert response.status_code == 401


def test_upsert_journal_entry_creates_new_entry(authed_client):
    client, _ = authed_client
    response = client.post("/journal/entry", json={
        "date": "2026-01-01", "sleep_hours": 7.5, "water_intake_liters": 2.0,
        "stress_level": 3, "exercise_minutes": 30, "notes": "Felt good today",
    })
    assert response.status_code == 200
    assert response.json()["sleep_hours"] == 7.5


def test_upsert_journal_entry_same_date_updates_not_duplicates(authed_client):
    client, _ = authed_client
    client.post("/journal/entry", json={"date": "2026-01-02", "sleep_hours": 6})
    client.post("/journal/entry", json={"date": "2026-01-02", "sleep_hours": 9})

    entries = client.get("/journal/entries").json()
    matching = [e for e in entries if e["date"] == "2026-01-02"]
    assert len(matching) == 1
    assert matching[0]["sleep_hours"] == 9


def test_upsert_journal_entry_rejects_stress_level_out_of_range(authed_client):
    client, _ = authed_client
    response = client.post("/journal/entry", json={"date": "2026-01-03", "stress_level": 6})
    assert response.status_code == 422


def test_upsert_journal_entry_rejects_negative_sleep_hours(authed_client):
    client, _ = authed_client
    response = client.post("/journal/entry", json={"date": "2026-01-03", "sleep_hours": -1})
    assert response.status_code == 422


def test_upsert_journal_entry_rejects_sleep_hours_over_24(authed_client):
    client, _ = authed_client
    response = client.post("/journal/entry", json={"date": "2026-01-03", "sleep_hours": 25})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /journal/entries
# ---------------------------------------------------------------------------

def test_get_entries_requires_authentication(client):
    response = client.get("/journal/entries")
    assert response.status_code == 401


def test_get_entries_returns_newest_first(authed_client):
    client, _ = authed_client
    client.post("/journal/entry", json={"date": "2026-01-01", "sleep_hours": 7})
    client.post("/journal/entry", json={"date": "2026-01-05", "sleep_hours": 8})
    entries = client.get("/journal/entries").json()
    assert entries[0]["date"] == "2026-01-05"
    assert entries[1]["date"] == "2026-01-01"


def test_get_entries_only_returns_current_users_entries(authed_client, db_session):
    from app.core.dependencies import get_current_user
    from app.main import app
    from tests.conftest import make_user

    client, user_a = authed_client
    client.post("/journal/entry", json={"date": "2026-01-01", "sleep_hours": 7})

    user_b = make_user(db_session, email="other@example.com")
    app.dependency_overrides[get_current_user] = lambda: user_b
    entries_for_b = client.get("/journal/entries").json()
    assert entries_for_b == []


# ---------------------------------------------------------------------------
# GET /journal/insights
# ---------------------------------------------------------------------------

def test_insights_with_insufficient_data_returns_empty_list(authed_client):
    client, _ = authed_client
    response = client.get("/journal/insights")
    assert response.status_code == 200
    body = response.json()
    assert body["insights"] == []
    assert "not enough" in body["message"].lower()


def test_insights_ignores_condition_gaps_below_minimum_sample_size(authed_client, db_session):
    """MIN_GAPS_FOR_INSIGHT is 3 — with only 2 scans (1 gap), no insight
    should be surfaced even if journal data exists for that gap."""
    client, user = authed_client
    base_time = datetime(2026, 1, 1)
    make_scan(db_session, user.id, base_time, acne_score=0.6)
    make_scan(db_session, user.id, base_time + timedelta(days=7), acne_score=0.2)

    client.post("/journal/entry", json={"date": "2026-01-02", "sleep_hours": 8})
    client.post("/journal/entry", json={"date": "2026-01-04", "sleep_hours": 4})

    response = client.get("/journal/insights")
    assert response.status_code == 200
    assert response.json()["insights"] == []
