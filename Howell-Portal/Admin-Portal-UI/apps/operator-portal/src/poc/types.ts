import type { CompanyPOCConfig, MultiViewConfig, PowerBIReportRef } from "@howell-technologies/portal";

export interface POCGeneratorState {
  configName: string;
  config: CompanyPOCConfig;
}

export interface POCHistoryState {
  current: POCGeneratorState;
  undoStack: POCGeneratorState[];
  redoStack: POCGeneratorState[];
  initialSnapshot: POCGeneratorState;
}

export interface POCExportMetadata {
  generatedAt: string;
  generatedBy: string;
  sourceRoute: string;
  appVersion: string;
}

export interface POCExportPayload {
  metadata: POCExportMetadata;
  configName: string;
  config: CompanyPOCConfig;
  implementationInstructions: string[];
}

export interface POCAuthSession {
  isAuthenticated: boolean;
  userEmail?: string;
  displayName?: string;
  tokenExpiresAt?: string;
  scopes: string[];
}

export interface MicrosoftRuntimeConfig {
  configured: boolean;
  clientId?: string;
  tenantId?: string;
  hasClientSecret: boolean;
}

export interface MicrosoftRuntimeConfigInput {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export interface SavedPOCConfigRecord {
  id: string;
  name: string;
  companyName: string;
  updatedAt: string;
  config: CompanyPOCConfig;
}

export interface SavedMultiViewRecord {
  id: string;
  name: string;
  updatedAt: string;
  multiView: MultiViewConfig;
}

export interface AvailableReportsResponse {
  reports: PowerBIReportRef[];
  skipped: {
    missingIds: number;
    missingGroupId: number;
  };
  workspacePermissionError: boolean;
}
