"""
Unit tests for app/services/cv_service.py

These import torch/torchvision/opencv and load the EfficientNet model, so
this module is noticeably slower to collect than the rest of the suite.
Run in isolation with:  pytest tests/test_cv_service.py -v

Fixtures used (tests/fixtures/):
  - sample_face.jpg / sample_face_2.jpg: real user-scan photos taken from
    the project's own `uploaded_scans/` folder — used as "should pass
    face-detection" cases.
  - no_face.jpg: a flat-color image with no face — used as a "should be
    rejected" case.
  - corrupt.jpg: a text file with a .jpg extension — used to test that
    malformed input degrades gracefully instead of raising.
"""
import os

import pytest

from app.services import cv_service
from tests.conftest import read_fixture_bytes


# ---------------------------------------------------------------------------
# check_face_quality
# ---------------------------------------------------------------------------

def test_check_face_quality_accepts_a_real_face_photo():
    image_bytes = read_fixture_bytes("sample_face.jpg")
    result = cv_service.check_face_quality(image_bytes)
    assert result["passed"] is True
    assert result["issues"] == []


def test_check_face_quality_rejects_image_with_no_face():
    image_bytes = read_fixture_bytes("no_face.jpg")
    result = cv_service.check_face_quality(image_bytes)
    assert result["passed"] is False
    assert len(result["issues"]) == 1
    assert "face" in result["issues"][0].lower()


def test_check_face_quality_handles_corrupt_image_without_raising():
    image_bytes = read_fixture_bytes("corrupt.jpg")
    result = cv_service.check_face_quality(image_bytes)
    assert result["passed"] is False
    assert len(result["issues"]) == 1


def test_check_face_quality_handles_empty_bytes_without_raising():
    result = cv_service.check_face_quality(b"")
    assert result["passed"] is False


# ---------------------------------------------------------------------------
# analyze_skin
# ---------------------------------------------------------------------------

def test_analyze_skin_returns_all_expected_score_keys():
    image_bytes = read_fixture_bytes("sample_face.jpg")
    scores = cv_service.analyze_skin(image_bytes)

    expected_keys = {
        "acne_score", "dark_spots_score", "pores_score",
        "wrinkles_score", "redness_score", "dark_circles_score",
        "photo_confidence",
    }
    assert set(scores.keys()) == expected_keys


def test_analyze_skin_scores_are_in_valid_range():
    image_bytes = read_fixture_bytes("sample_face.jpg")
    scores = cv_service.analyze_skin(image_bytes)

    for key, value in scores.items():
        assert 0.0 <= value <= 1.0, f"{key}={value} is outside [0,1]"


def test_analyze_skin_is_deterministic_for_the_same_image():
    """The model is in eval() mode with no dropout/augmentation active,
    so the same input image must always produce the same scores."""
    image_bytes = read_fixture_bytes("sample_face.jpg")
    first = cv_service.analyze_skin(image_bytes)
    second = cv_service.analyze_skin(image_bytes)
    assert first == second


def test_analyze_skin_raises_on_unreadable_image():
    """Unlike check_face_quality, analyze_skin has no internal try/except —
    callers (the /scan/analyze route) are expected to run check_face_quality
    and check_photo_quality first. Documenting that contract here."""
    with pytest.raises(Exception):
        cv_service.analyze_skin(b"not an image")
