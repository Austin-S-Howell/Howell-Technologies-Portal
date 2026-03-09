from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

POWER_BI_API = "https://api.powerbi.com/v1.0/myorg"


@dataclass
class AvailableReportsResult:
    reports: list[dict[str, Any]]
    skipped_missing_ids: int
    skipped_missing_group_id: int
    workspace_permission_error: bool


def _extract_report(record: dict[str, Any], group_id: str | None) -> dict[str, Any] | None:
    report_id = record.get("id")
    if not report_id:
        return None

    embed_url = record.get("embedUrl") or f"https://app.powerbi.com/reportEmbed?reportId={report_id}"
    return {
        "reportId": report_id,
        "groupId": group_id,
        "name": record.get("name") or "Untitled report",
        "description": record.get("description"),
        "embedUrl": embed_url,
        "workspaceName": record.get("workspaceName"),
        "lastUpdated": record.get("modifiedDateTime"),
    }


def _dedupe_reports(reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}
    for report in reports:
        report_id = report.get("reportId")
        if not report_id:
            continue
        deduped[report_id] = report
    return list(deduped.values())


async def fetch_available_reports(access_token: str) -> AvailableReportsResult:
    headers = {"Authorization": f"Bearer {access_token}"}
    workspace_permission_error = False
    skipped_missing_ids = 0
    skipped_missing_group_id = 0
    collected: list[dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=20.0) as client:
        direct_response = await client.get(f"{POWER_BI_API}/reports", headers=headers)
        direct_response.raise_for_status()
        direct_reports = direct_response.json().get("value", [])

        for report in direct_reports:
            extracted = _extract_report(report, report.get("groupId"))
            if extracted:
                collected.append(extracted)
            else:
                skipped_missing_ids += 1

        groups_response = await client.get(f"{POWER_BI_API}/groups", headers=headers)
        groups_response.raise_for_status()
        groups = groups_response.json().get("value", [])

        for group in groups:
            group_id = group.get("id")
            group_name = group.get("name")
            if not group_id:
                skipped_missing_group_id += 1
                continue
            try:
                group_reports_response = await client.get(f"{POWER_BI_API}/groups/{group_id}/reports", headers=headers)
                group_reports_response.raise_for_status()
            except httpx.HTTPStatusError as error:
                status_code = error.response.status_code
                if status_code in (401, 403):
                    workspace_permission_error = True
                    continue
                raise

            group_reports = group_reports_response.json().get("value", [])
            for report in group_reports:
                report["workspaceName"] = group_name
                extracted = _extract_report(report, group_id)
                if extracted:
                    collected.append(extracted)
                else:
                    skipped_missing_ids += 1

    return AvailableReportsResult(
        reports=_dedupe_reports(collected),
        skipped_missing_ids=skipped_missing_ids,
        skipped_missing_group_id=skipped_missing_group_id,
        workspace_permission_error=workspace_permission_error,
    )


async def generate_embed_token(
    access_token: str,
    report_id: str,
    group_id: str | None = None,
    dataset_id: str | None = None,
) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    body: dict[str, Any] = {"accessLevel": "view", "allowSaveAs": False}
    if dataset_id:
        body["datasets"] = [{"id": dataset_id}]

    if group_id:
        endpoint = f"{POWER_BI_API}/groups/{group_id}/reports/{report_id}/GenerateToken"
        report_endpoint = f"{POWER_BI_API}/groups/{group_id}/reports/{report_id}"
    else:
        endpoint = f"{POWER_BI_API}/reports/{report_id}/GenerateToken"
        report_endpoint = f"{POWER_BI_API}/reports/{report_id}"

    async with httpx.AsyncClient(timeout=20.0) as client:
        report_response = await client.get(report_endpoint, headers=headers)
        report_response.raise_for_status()
        report_json = report_response.json()

        token_response = await client.post(endpoint, headers=headers, json=body)
        token_response.raise_for_status()
        token_json = token_response.json()

    return {
        "reportId": report_id,
        "groupId": group_id or "",
        "embedUrl": report_json.get("embedUrl") or "",
        "embedToken": token_json.get("token") or "",
        "tokenExpiry": token_json.get("expiration") or "",
    }
