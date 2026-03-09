from app.routers.auth import INVALID_OPERATOR_CREDENTIALS_MESSAGE


def test_auth_session_defaults_to_unauthenticated(client):
    response = client.get("/api/auth/session")
    assert response.status_code == 200
    payload = response.json()
    assert payload["isAuthenticated"] is False
    assert payload["scopes"] == []


def test_logout_clears_session(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_callback_requires_auth_flow(client):
    configure_response = client.post(
        "/api/auth/microsoft/config",
        json={
            "clientId": "test-client-id",
            "clientSecret": "test-client-secret",
            "tenantId": "test-tenant-id",
        },
    )
    assert configure_response.status_code == 200

    response = client.get("/api/auth/microsoft/callback")
    assert response.status_code == 400
    assert "Missing Microsoft auth flow" in response.json()["detail"]


def test_login_is_unavailable_when_ms_not_configured(client):
    response = client.get("/api/auth/microsoft/login", follow_redirects=False)
    assert response.status_code == 503


def test_microsoft_config_can_be_set_and_fetched(client):
    initial = client.get("/api/auth/microsoft/config")
    assert initial.status_code == 200
    assert initial.json()["configured"] is False

    update = client.post(
        "/api/auth/microsoft/config",
        json={
            "clientId": "configured-client",
            "clientSecret": "configured-secret",
            "tenantId": "configured-tenant",
        },
    )
    assert update.status_code == 200
    payload = update.json()
    assert payload["configured"] is True
    assert payload["clientId"] == "configured-client"
    assert payload["tenantId"] == "configured-tenant"
    assert payload["hasClientSecret"] is True

    fetched = client.get("/api/auth/microsoft/config")
    assert fetched.status_code == 200
    fetched_payload = fetched.json()
    assert fetched_payload["configured"] is True
    assert fetched_payload["clientId"] == "configured-client"
    assert fetched_payload["tenantId"] == "configured-tenant"
    assert fetched_payload["hasClientSecret"] is True


def test_operator_login_succeeds_with_matching_database_credentials(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.auth.find_operator_user",
        lambda session, username: {"username": username, "password": "secret-pass"},
    )

    response = client.post(
        "/api/auth/operator/login",
        json={"username": "operator@example.com", "password": "secret-pass"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "operator@example.com"
    assert payload["role"] == "Operator"

    session_response = client.get("/api/auth/operator/session")
    assert session_response.status_code == 200
    session_payload = session_response.json()
    assert session_payload["isAuthenticated"] is True
    assert session_payload["session"]["email"] == "operator@example.com"


def test_operator_login_rejects_bad_username_password_combo(client, monkeypatch):
    monkeypatch.setattr("app.routers.auth.find_operator_user", lambda session, username: None)

    missing_user_response = client.post(
        "/api/auth/operator/login",
        json={"username": "missing@example.com", "password": "whatever"},
    )
    assert missing_user_response.status_code == 401
    assert missing_user_response.json()["detail"] == INVALID_OPERATOR_CREDENTIALS_MESSAGE

    monkeypatch.setattr(
        "app.routers.auth.find_operator_user",
        lambda session, username: {"username": username, "password": "correct-pass"},
    )
    wrong_password_response = client.post(
        "/api/auth/operator/login",
        json={"username": "operator@example.com", "password": "wrong-pass"},
    )
    assert wrong_password_response.status_code == 401
    assert wrong_password_response.json()["detail"] == INVALID_OPERATOR_CREDENTIALS_MESSAGE
