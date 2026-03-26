"""Authentication API tests."""

from __future__ import annotations


def test_register_login_and_profile(client):
    """Register a user, log in again, and fetch the profile."""

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Aarav Mehta",
            "email": "aarav@example.com",
            "company_name": "Cubitax Advisory",
            "pan_number": "ABCDE1234F",
            "gstin": "29ABCDE1234F1Z5",
            "password": "StrongPass1!"
        },
    )

    assert register_response.status_code == 201
    register_payload = register_response.json()
    assert register_payload["user"]["email"] == "aarav@example.com"
    assert register_payload["token_type"] == "bearer"

    login_response = client.post(
        "/api/auth/login",
        json={"email": "aarav@example.com", "password": "StrongPass1!"},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()

    profile_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["company_name"] == "Cubitax Advisory"

