from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ThemeModel(BaseModel):
    primary: str | None = None
    surface: str | None = None
    accent: str | None = None
    text: str | None = None
    mutedText: str | None = None


class BrandingModel(BaseModel):
    companyName: str
    logoUrl: str | None = None
    tagLine: str | None = None
    theme: ThemeModel | None = None


class SessionModel(BaseModel):
    id: str
    name: str
    email: str
    role: str | None = None


class WidgetModel(BaseModel):
    id: str
    title: str
    type: Literal["metric", "status", "text"]
    value: str
    description: str | None = None
    tone: Literal["positive", "neutral", "warning"] | None = None


class ReportModel(BaseModel):
    reportId: str
    groupId: str | None = None
    name: str
    description: str | None = None
    embedUrl: str
    workspaceName: str | None = None
    lastUpdated: str | None = None


class MultiViewTileModel(BaseModel):
    id: str
    reportId: str
    groupId: str | None = None
    title: str
    pageName: str | None = None
    x: int
    y: int
    w: int
    h: int


class MultiViewModel(BaseModel):
    id: str
    name: str
    description: str | None = None
    tiles: list[MultiViewTileModel]


class PortalContentModel(BaseModel):
    headline: str
    subheadline: str
    statusMessage: str
    announcements: list[str] = Field(default_factory=list)
    reportGoal: str | None = None
    widgets: list[WidgetModel]


class CompanyPOCConfigModel(BaseModel):
    companyName: str
    audience: str
    branding: BrandingModel
    features: dict[str, bool]
    session: SessionModel
    content: PortalContentModel
    reports: list[ReportModel]
    multiViews: list[MultiViewModel]


class AuthSessionResponse(BaseModel):
    isAuthenticated: bool
    userEmail: str | None = None
    displayName: str | None = None
    tokenExpiresAt: str | None = None
    scopes: list[str] = Field(default_factory=list)


class MicrosoftConfigRequest(BaseModel):
    clientId: str = Field(min_length=1)
    clientSecret: str = Field(min_length=1)
    tenantId: str = Field(min_length=1)


class MicrosoftConfigResponse(BaseModel):
    configured: bool
    clientId: str | None = None
    tenantId: str | None = None
    hasClientSecret: bool


class ReportsAvailableResponse(BaseModel):
    reports: list[ReportModel]
    skipped: dict[str, int]
    workspacePermissionError: bool


class EmbedTokenRequest(BaseModel):
    reportId: str
    groupId: str | None = None
    datasetId: str | None = None
    pageName: str | None = None


class EmbedTokenResponse(BaseModel):
    reportId: str
    groupId: str | None = None
    pageName: str | None = None
    embedUrl: str
    embedToken: str
    tokenExpiry: str


class POCConfigUpsertRequest(BaseModel):
    name: str
    config: CompanyPOCConfigModel


class POCConfigRecord(BaseModel):
    id: str
    name: str
    companyName: str
    updatedAt: datetime
    config: CompanyPOCConfigModel


class MultiViewUpsertRequest(BaseModel):
    name: str
    multiView: MultiViewModel


class MultiViewRecord(BaseModel):
    id: str
    name: str
    updatedAt: datetime
    multiView: MultiViewModel
