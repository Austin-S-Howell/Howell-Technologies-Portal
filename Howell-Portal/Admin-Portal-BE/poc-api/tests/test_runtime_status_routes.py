from datetime import datetime, timedelta, timezone


def make_payload(**overrides):
    payload = {
        "clientId": "riverbend-health",
        "clientName": "Riverbend Health",
        "applicationId": "riverbend-care-hub",
        "applicationName": "Care Hub",
        "portalName": "Riverbend Care Hub",
        "portalUrl": "https://portal.riverbendcare.example.com",
        "environment": "Production",
        "status": "live",
        "responseTimeMs": 182,
        "currentPath": "/portal/home",
        "buildVersion": "portal-library@0.1.0",
    }
    payload.update(overrides)
    return payload


def test_runtime_heartbeat_ingests_and_lists_status(client):
    created = client.post("/api/runtime-status/heartbeat", json=make_payload())
    assert created.status_code == 202
    assert created.json()["ok"] is True

    listed = client.get("/api/runtime-status/applications")
    assert listed.status_code == 200
    rows = listed.json()
    assert len(rows) == 1
    assert rows[0]["clientId"] == "riverbend-health"
    assert rows[0]["applicationId"] == "riverbend-care-hub"
    assert rows[0]["reportedStatus"] == "live"
    assert rows[0]["effectiveStatus"] == "live"
    assert rows[0]["responseTimeMs"] == 182
    assert rows[0]["isStale"] is False


def test_runtime_status_marks_stale_heartbeats_as_down(client):
    stale_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    created = client.post(
        "/api/runtime-status/heartbeat",
        json=make_payload(status="live", checkedAt=stale_time),
    )
    assert created.status_code == 202

    listed = client.get("/api/runtime-status/applications")
    assert listed.status_code == 200
    rows = listed.json()
    assert len(rows) == 1
    assert rows[0]["reportedStatus"] == "live"
    assert rows[0]["effectiveStatus"] == "down"
    assert rows[0]["isStale"] is True
