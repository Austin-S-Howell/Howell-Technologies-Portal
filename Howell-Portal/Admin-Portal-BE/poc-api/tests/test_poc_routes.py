from copy import deepcopy


def make_config_payload():
    return {
        "name": "Acme POC",
        "config": {
            "companyName": "Acme Corp",
            "audience": "Operations leadership",
            "branding": {"companyName": "Acme Corp", "tagLine": "Operate better", "theme": {"primary": "#45505f"}},
            "features": {"reports": True},
            "session": {"id": "u-1", "name": "Alex", "email": "alex@acme.example", "role": "Admin"},
            "content": {
                "headline": "Acme Portal",
                "subheadline": "POC",
                "statusMessage": "Healthy",
                "reportGoal": "Daily brief",
                "announcements": ["Welcome"],
                "widgets": [{"id": "w1", "title": "Availability", "type": "metric", "value": "99.9%"}],
            },
            "reports": [
                {
                    "reportId": "r1",
                    "groupId": "g1",
                    "name": "Ops report",
                    "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=r1",
                }
            ],
            "multiViews": [{"id": "mv1", "name": "Morning", "tiles": [{"id": "t1", "reportId": "r1", "title": "Main", "x": 0, "y": 0, "w": 12, "h": 4}]}],
        },
    }


def test_poc_config_crud(client):
    headers = {"x-dev-user-email": "owner@example.com"}
    payload = make_config_payload()

    created = client.post("/api/poc/configs", headers=headers, json=payload)
    assert created.status_code == 201
    config_id = created.json()["id"]

    listed = client.get("/api/poc/configs", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["companyName"] == "Acme Corp"

    update_payload = deepcopy(payload)
    update_payload["name"] = "Acme POC Updated"
    update_payload["config"]["companyName"] = "Acme Holdings"
    updated = client.put(f"/api/poc/configs/{config_id}", headers=headers, json=update_payload)
    assert updated.status_code == 200
    assert updated.json()["name"] == "Acme POC Updated"
    assert updated.json()["companyName"] == "Acme Holdings"

    deleted = client.delete(f"/api/poc/configs/{config_id}", headers=headers)
    assert deleted.status_code == 204

    listed_after = client.get("/api/poc/configs", headers=headers)
    assert listed_after.status_code == 200
    assert listed_after.json() == []


def test_poc_config_enforces_user_ownership(client):
    create_headers = {"x-dev-user-email": "owner@example.com"}
    other_headers = {"x-dev-user-email": "other@example.com"}
    payload = make_config_payload()

    created = client.post("/api/poc/configs", headers=create_headers, json=payload)
    assert created.status_code == 201
    config_id = created.json()["id"]

    deleted = client.delete(f"/api/poc/configs/{config_id}", headers=other_headers)
    assert deleted.status_code == 404
