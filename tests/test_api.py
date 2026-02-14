import copy
import urllib.parse

import pytest
from fastapi.testclient import TestClient

import src.app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the in-memory `activities` dict before/after each test."""
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(original)


@pytest.fixture
def client():
    return TestClient(app_module.app)


def _activity_path(activity: str, suffix: str = "") -> str:
    return f"/activities/{urllib.parse.quote(activity)}{suffix}"


def test_get_activities_structure(client):
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Basketball Team" in data
    assert isinstance(data["Basketball Team"]["participants"], list)


def test_signup_and_duplicate_rejected(client):
    activity = "Basketball Team"
    email = "tester@mergington.edu"

    # first signup succeeds
    r1 = client.post(_activity_path(activity, "/signup"), params={"email": email})
    assert r1.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # duplicate signup is rejected
    r2 = client.post(_activity_path(activity, "/signup"), params={"email": email})
    assert r2.status_code == 400
    assert r2.json().get("detail") == "Student is already signed up for this activity"


def test_signup_fails_when_full(client):
    activity = "Tennis Club"
    # make the activity full
    app_module.activities[activity]["max_participants"] = 1
    app_module.activities[activity]["participants"] = ["already@mergington.edu"]

    # attempt to sign up another student
    r = client.post(_activity_path(activity, "/signup"), params={"email": "latecomer@mergington.edu"})
    assert r.status_code == 400
    assert r.json().get("detail") == "Activity is full"


def test_remove_participant_and_404(client):
    activity = "Drama Club"
    email = "remove-me@mergington.edu"

    # add a temporary participant and remove them
    app_module.activities[activity]["participants"].append(email)
    assert email in app_module.activities[activity]["participants"]

    r = client.delete(_activity_path(activity, "/participants"), params={"email": email})
    assert r.status_code == 200
    assert r.json().get("message") == f"Removed {email} from {activity}"
    assert email not in app_module.activities[activity]["participants"]

    # removing a non-existent participant returns 404
    r2 = client.delete(_activity_path(activity, "/participants"), params={"email": "nope@mergington.edu"})
    assert r2.status_code == 404
    assert r2.json().get("detail") == "Participant not found"
