import unittest

from app.services.recommendation_service import get_combined_scores, get_active_conditions


class TestRecommendationService(unittest.TestCase):
    def test_get_combined_scores_knows_skin_type_good_photo(self):
        cv_scores = {
            "acne_score": 0.4,
            "redness_score": 0.2,
            "texture_score": 0.0,
            "dark_spots_score": 0.0,
            "pores_score": 0.0,
            "dark_circles_score": 0.0,
        }
        skin_profile = {
            "skin_type": "Normal",
            "concern_one": "Acne",
            "concern_two": "Pores",
        }

        combined = get_combined_scores(cv_scores, skin_profile, photo_confidence=0.8)

        self.assertEqual(combined["acne_score"], round(0.4 * 0.65 + 1.0 * 0.35, 4))
        self.assertEqual(combined["pores_score"], round(0.0 * 0.65 + 0.5 * 0.35, 4))
        self.assertEqual(combined["redness_score"], round(0.2 * 0.65 + 0.0 * 0.35, 4))

    def test_get_combined_scores_unknown_skin_type_bad_photo(self):
        cv_scores = {
            "acne_score": 0.6,
            "redness_score": 0.0,
            "texture_score": 0.0,
            "dark_spots_score": 0.0,
            "pores_score": 0.0,
            "dark_circles_score": 0.0,
        }
        skin_profile = {
            "skin_type": "Unknown",
            "concern_one": "Acne",
            "concern_two": None,
        }

        combined = get_combined_scores(cv_scores, skin_profile, photo_confidence=0.6)

        self.assertEqual(combined["acne_score"], round(0.6 * 0.45 + 1.0 * 0.55, 4))
        self.assertEqual(combined["pores_score"], 0.0)

    def test_get_active_conditions_applies_threshold(self):
        cv_scores = {
            "acne_score": 0.0,
            "redness_score": 0.0,
            "texture_score": 0.0,
            "dark_spots_score": 0.0,
            "pores_score": 0.0,
            "dark_circles_score": 0.0,
        }
        skin_profile = {
            "skin_type": "Dry",
            "concern_one": "Texture",
            "concern_two": None,
        }

        active = get_active_conditions(cv_scores, skin_profile, photo_confidence=0.9)

        self.assertEqual(active, {"texture": round(0.35, 4)})


if __name__ == "__main__":
    unittest.main()
