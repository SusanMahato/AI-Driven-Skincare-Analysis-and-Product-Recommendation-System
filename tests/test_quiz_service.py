"""Unit tests for app/services/quiz_service.py"""
from app.services import quiz_service
from app.schemas.quiz import QuizSubmit
from tests.conftest import make_user


def sample_quiz_data(**overrides):
    defaults = dict(
        age_range="25-34",
        gender="Female",
        skin_type="Oily",
        products_used_before="Regularly",
        sensitivity=None,
        sun_exposure="1-3hrs",
        concern_one="Acne",
        concern_two="Pores",
        skin_goal="Clear skin",
    )
    defaults.update(overrides)
    return QuizSubmit(**defaults)


def test_get_skin_profile_returns_none_when_not_created(db_session):
    user = make_user(db_session)
    assert quiz_service.get_skin_profile(db_session, user.id) is None


def test_create_skin_profile_persists_all_fields(db_session):
    user = make_user(db_session)
    profile = quiz_service.create_skin_profile(db_session, user.id, sample_quiz_data())

    assert profile.id is not None
    assert profile.user_id == user.id
    assert profile.skin_type == "Oily"
    assert profile.concern_one == "Acne"
    assert profile.concern_two == "Pores"


def test_create_skin_profile_then_get_returns_same_row(db_session):
    user = make_user(db_session)
    created = quiz_service.create_skin_profile(db_session, user.id, sample_quiz_data())
    fetched = quiz_service.get_skin_profile(db_session, user.id)
    assert fetched.id == created.id


def test_update_skin_profile_overwrites_existing_values(db_session):
    user = make_user(db_session)
    quiz_service.create_skin_profile(db_session, user.id, sample_quiz_data(skin_type="Oily"))

    updated = quiz_service.update_skin_profile(
        db_session, user.id, sample_quiz_data(skin_type="Dry", concern_one="Dryness")
    )

    assert updated.skin_type == "Dry"
    assert updated.concern_one == "Dryness"
    # Still only one profile row for this user (updated, not duplicated).
    all_profiles_for_user = [
        p for p in db_session.query(type(updated)).all() if p.user_id == user.id
    ]
    assert len(all_profiles_for_user) == 1


def test_update_skin_profile_creates_one_if_none_exists(db_session):
    """update_skin_profile on a user with no profile yet should behave like create."""
    user = make_user(db_session)
    profile = quiz_service.update_skin_profile(db_session, user.id, sample_quiz_data())
    assert profile.id is not None
    assert profile.user_id == user.id


def test_two_users_have_independent_skin_profiles(db_session):
    user_a = make_user(db_session, email="a@example.com")
    user_b = make_user(db_session, email="b@example.com")

    quiz_service.create_skin_profile(db_session, user_a.id, sample_quiz_data(skin_type="Oily"))
    quiz_service.create_skin_profile(db_session, user_b.id, sample_quiz_data(skin_type="Dry"))

    assert quiz_service.get_skin_profile(db_session, user_a.id).skin_type == "Oily"
    assert quiz_service.get_skin_profile(db_session, user_b.id).skin_type == "Dry"
