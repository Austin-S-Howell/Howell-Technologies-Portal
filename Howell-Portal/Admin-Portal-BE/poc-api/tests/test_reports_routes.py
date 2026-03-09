from app.services.powerbi import AvailableReportsResult


def test_available_reports_route(client, seed_user_session, monkeypatch):
    async def fake_fetch_available_reports(_access_token: str):
        return AvailableReportsResult(
            reports=[
                {
                    "reportId": "r1",
                    "groupId": "g1",
                    "name": "Report One",
                    "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=r1",
                }
            ],
            skipped_missing_ids=1,
            skipped_missing_group_id=0,
            workspace_permission_error=False,
        )

    monkeypatch.setattr("app.routers.reports.fetch_available_reports", fake_fetch_available_reports)

    response = client.get("/api/reports/available", headers={"x-dev-user-email": "reports@example.com"})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["reports"]) == 1
    assert payload["reports"][0]["reportId"] == "r1"
    assert payload["skipped"]["missingIds"] == 1


def test_embed_token_route(client, seed_user_session, monkeypatch):
    async def fake_generate_embed_token(access_token: str, report_id: str, group_id: str | None, dataset_id: str | None):
        assert access_token == "test-access-token"
        assert report_id == "r1"
        assert group_id == "g1"
        assert dataset_id is None
        return {
            "reportId": "r1",
            "groupId": "g1",
            "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=r1",
            "embedToken": "embed-token",
            "tokenExpiry": "2030-01-01T00:00:00Z",
        }

    monkeypatch.setattr("app.routers.reports.generate_embed_token", fake_generate_embed_token)

    response = client.post(
        "/api/reports/embed-token",
        headers={"x-dev-user-email": "reports@example.com"},
        json={"reportId": "r1", "groupId": "g1"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["embedToken"] == "embed-token"
