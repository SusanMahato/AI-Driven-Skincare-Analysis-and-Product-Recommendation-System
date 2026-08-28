"""
Unit tests for app/services/recommendation_service.py

NOTE ON THE PREVIOUS TEST FILE:
The repository already contained a `tests/test_recommendation_service.py`
that imported `get_combined_scores` and called `get_active_conditions()`
with 3 arguments (`cv_scores, skin_profile, photo_confidence=...`). Neither
matches the current `recommendation_service.py`:
  - `get_combined_scores` does not exist in the current file at all
    (the import would raise `ImportError` before any test runs).
  - `get_active_conditions(cv_scores)` currently takes a single argument.
This means the existing test file is stale relative to the shipped code
and cannot currently pass/run. This file replaces it and tests the
functions as they exist today. See the Test Plan document, section
"Defects & Observations", item D-01.
"""
from unittest.mock import MagicMock, patch

import pytest

from app.services import recommendation_service as rec


# ---------------------------------------------------------------------------
# get_spf_recommendation
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("uv_index,expected_spf", [
    (None, 30),
    (0, 30),
    (2.9, 30),
    (3, 40),
    (6, 40),
    (6.1, 50),
    (11, 50),
])
def test_get_spf_recommendation(uv_index, expected_spf):
    assert rec.get_spf_recommendation(uv_index) == expected_spf


# ---------------------------------------------------------------------------
# get_recommended_ingredients
# ---------------------------------------------------------------------------

def test_get_recommended_ingredients_acne_from_cv_score():
    ingredients = rec.get_recommended_ingredients(
        {"acne_score": 0.8}, {"concern_one": "Hydration"}
    )
    assert "Salicylic Acid" in ingredients
    assert "Niacinamide" in ingredients


def test_get_recommended_ingredients_acne_from_quiz_concern():
    ingredients = rec.get_recommended_ingredients(
        {"acne_score": 0.1}, {"concern_one": "Acne"}
    )
    assert "Salicylic Acid" in ingredients


def test_get_recommended_ingredients_no_duplicates():
    """Niacinamide is added by 3 different rules (acne, pores, oily) —
    the result must be de-duplicated while preserving first-seen order."""
    ingredients = rec.get_recommended_ingredients(
        {"acne_score": 0.9, "pores_score": 0.9},
        {"skin_type": "Oily"},
    )
    assert ingredients.count("Niacinamide") == 1


def test_get_recommended_ingredients_always_includes_spf():
    ingredients = rec.get_recommended_ingredients({}, {})
    assert any(i.startswith("SPF") for i in ingredients)
    assert "SPF 30" in ingredients  # default SPF when uv_index is None


def test_get_recommended_ingredients_empty_inputs_still_returns_spf_only():
    ingredients = rec.get_recommended_ingredients({}, {})
    assert ingredients == ["SPF 30"]


def test_get_recommended_ingredients_dryness_maps_to_hyaluronic_acid():
    ingredients = rec.get_recommended_ingredients({}, {"skin_type": "Dry"})
    assert "Hyaluronic Acid" in ingredients
    assert "Ceramides" in ingredients


def test_get_recommended_ingredients_anti_aging_goal_adds_retinol():
    ingredients = rec.get_recommended_ingredients({}, {"skin_goal": "Anti-aging"})
    assert "Retinol" in ingredients
    assert "Peptides" in ingredients


# ---------------------------------------------------------------------------
# generate_skin_report — mock the Groq client so tests don't hit the network
# ---------------------------------------------------------------------------

def test_generate_skin_report_returns_llm_text():
    fake_response = MagicMock()
    fake_response.choices[0].message.content = "You have mild acne. Use salicylic acid."

    with patch.object(rec.client.chat.completions, "create", return_value=fake_response) as mock_create:
        report = rec.generate_skin_report(
            cv_scores={"acne_score": 0.6, "redness_score": 0.1, "wrinkles_score": 0.1,
                       "dark_spots_score": 0.1, "pores_score": 0.1, "dark_circles_score": 0.1},
            skin_profile={"skin_type": "Oily", "age_range": "18-24", "concern_one": "Acne",
                          "concern_two": None, "skin_goal": "Clear skin",
                          "sun_exposure": "1-3hrs", "sensitivity": None},
            weather={"temperature": 28, "humidity": 60, "weather_condition": "clear", "uv_index": 5},
            ingredients=["Salicylic Acid", "Niacinamide"],
        )
    assert report == "You have mild acne. Use salicylic acid."
    mock_create.assert_called_once()
    assert mock_create.call_args.kwargs["model"] == "llama-3.3-70b-versatile"


# ---------------------------------------------------------------------------
# get_active_conditions
# ---------------------------------------------------------------------------

def test_get_active_conditions_above_threshold():
    active = rec.get_active_conditions({"acne_score": 0.5, "redness_score": 0.05})
    assert "acne" in active
    assert "redness" not in active  # 0.05 <= SCORE_THRESHOLD (0.10)


def test_get_active_conditions_handles_missing_keys():
    active = rec.get_active_conditions({})
    assert active == {}


def test_get_active_conditions_wrinkles_maps_to_texture():
    active = rec.get_active_conditions({"wrinkles_score": 0.9})
    assert active == {"texture": 0.9}


# ---------------------------------------------------------------------------
# ingredient_engine — uses fake Ingredient-like objects + a fake DB session
# ---------------------------------------------------------------------------

class FakeIngredient:
    def __init__(self, id, name, skin_type_tags=None, condition_tags=None,
                 conflict_with=None, safe_time=None, weather_tags=None,
                 benefit_description=""):
        self.id = id
        self.name = name
        self.skin_type_tags = skin_type_tags or []
        self.condition_tags = condition_tags or []
        self.conflict_with = conflict_with or []
        self.safe_time = safe_time
        self.weather_tags = weather_tags or []
        self.benefit_description = benefit_description


def make_fake_db(all_ingredients=None, all_products=None):
    db = MagicMock()

    def query_side_effect(model):
        query = MagicMock()
        if model.__name__ == "Ingredient":
            query.all.return_value = all_ingredients or []
        elif model.__name__ == "Product":
            query.all.return_value = all_products or []
        else:
            query.all.return_value = []
        return query

    db.query.side_effect = query_side_effect
    return db


def test_ingredient_engine_filters_by_skin_type():
    ingredients = [
        FakeIngredient(1, "Salicylic Acid", skin_type_tags=["oily"], condition_tags=["acne"], safe_time="night"),
        FakeIngredient(2, "Hyaluronic Acid", skin_type_tags=["dry"], condition_tags=["acne"], safe_time="both"),
    ]
    db = make_fake_db(all_ingredients=ingredients)

    result = rec.ingredient_engine(
        cv_scores={"acne_score": 0.9},
        skin_profile={"skin_type": "Oily"},
        weather={},
        db=db,
    )

    all_names = [i["name"] for i in result["morning"] + result["night"]]
    assert "Salicylic Acid" in all_names
    assert "Hyaluronic Acid" not in all_names  # tagged "dry", user is "oily"


def test_ingredient_engine_no_active_conditions_returns_empty():
    ingredients = [FakeIngredient(1, "Retinol", condition_tags=["acne"], safe_time="night")]
    db = make_fake_db(all_ingredients=ingredients)

    result = rec.ingredient_engine(
        cv_scores={},  # nothing above threshold
        skin_profile={"skin_type": "Normal"},
        weather={},
        db=db,
    )
    assert result["morning"] == []
    assert result["night"] == []


def test_ingredient_engine_caps_each_list_at_eight():
    ingredients = [
        FakeIngredient(i, f"Ingredient{i}", condition_tags=["acne"], safe_time="night")
        for i in range(20)
    ]
    db = make_fake_db(all_ingredients=ingredients)

    result = rec.ingredient_engine(
        cv_scores={"acne_score": 0.9},
        skin_profile={"skin_type": "Normal"},
        weather={},
        db=db,
    )
    assert len(result["night"]) <= 8
    assert len(result["morning"]) <= 8


def test_ingredient_engine_flags_conflicts():
    ingredients = [
        FakeIngredient(1, "Retinol", condition_tags=["texture"], safe_time="night",
                        conflict_with=["Vitamin C"]),
        FakeIngredient(2, "Vitamin C", condition_tags=["dark_spots"], safe_time="morning"),
    ]
    db = make_fake_db(all_ingredients=ingredients)

    result = rec.ingredient_engine(
        cv_scores={"wrinkles_score": 0.9, "dark_spots_score": 0.9},
        skin_profile={"skin_type": "Normal"},
        weather={},
        db=db,
    )
    assert len(result["conflict_warnings"]) >= 1
    assert "Retinol" in result["conflict_warnings"][0]


# ---------------------------------------------------------------------------
# Product-engine helper functions
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw,expected", [
    ("Foaming Face Wash", "cleanser"),
    ("Vitamin C Serum", "serum"),
    ("Night Cream", "moisturizer"),
    ("Sunscreen SPF50", "sunscreen"),
    ("Eye Cream", "eye_cream"),
    ("Clay Mask", "mask"),
    (None, "other"),
    ("nan", "other"),
    ("Something Unrecognized", "other"),
])
def test_normalize_category(raw, expected):
    assert rec.normalize_category(raw) == expected


def test_get_weather_context_flags_high_uv_and_humidity():
    tags = rec.get_weather_context({"uv_index": 8, "humidity": 80})
    assert "high_uv" in tags
    assert "humid" in tags
    assert "dry_climate" not in tags


def test_get_weather_context_flags_dry_climate():
    tags = rec.get_weather_context({"uv_index": 1, "humidity": 20})
    assert tags == ["dry_climate"]


def test_get_weather_context_handles_missing_values():
    # humidity/uv_index default to 0 when missing, and 0 humidity < 30
    # correctly triggers "dry_climate" — this is correct behavior, not a bug.
    assert rec.get_weather_context({}) == ["dry_climate"]

def test_apply_diversity_keeps_only_first_product_per_brand():
    products = [
        {"brand": "CeraVe", "name": "A"},
        {"brand": "CeraVe", "name": "B"},
        {"brand": "TheOrdinary", "name": "C"},
    ]
    result = rec.apply_diversity(products)
    brands = [p["brand"] for p in result]
    assert brands.count("CeraVe") == 1
    assert len(result) == 2


def test_build_routine_fills_available_steps_only():
    products = [
        {"id": 1, "category": "cleanser"},
        {"id": 2, "category": "moisturizer"},
    ]
    routine, used_ids = rec.build_routine(products, rec.ROUTINE_STEPS_MORNING)
    assert routine["cleanser"]["id"] == 1
    assert routine["moisturizer"]["id"] == 2
    assert "serum" not in routine  # no serum product supplied
    assert used_ids == {1, 2}


def test_build_routine_respects_exclude_ids():
    products = [{"id": 1, "category": "cleanser"}]
    routine, _ = rec.build_routine(products, ["cleanser"], exclude_ids={1})
    assert routine == {}  # id 1 already used elsewhere, must not be reused

