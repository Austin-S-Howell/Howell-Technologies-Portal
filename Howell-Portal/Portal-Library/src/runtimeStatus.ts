import { useEffect, useRef, useState } from "react";
import type {
  PortalHeartbeatConfig,
  PortalHeartbeatPayload,
  PortalHeartbeatResult,
  PortalHeartbeatSnapshot,
  PortalHeartbeatState,
} from "./types";

function resolveFetch(fetcher?: typeof fetch) {
  if (fetcher) {
    return fetcher;
  }
  if (typeof fetch !== "undefined") {
    return fetch.bind(globalThis);
  }
  throw new Error("Fetch is not available in this runtime.");
}

function defaultCurrentPath() {
  if (typeof window === "undefined") {
    return undefined;
  }
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

async function resolveSnapshot(config: PortalHeartbeatConfig): Promise<PortalHeartbeatSnapshot> {
  if (!config.getSnapshot) {
    return {};
  }
  return await config.getSnapshot();
}

export function createPortalStatusReporter(config: PortalHeartbeatConfig) {
  return {
    async report(override: PortalHeartbeatSnapshot = {}): Promise<PortalHeartbeatResult | null> {
      if (config.enabled === false) {
        return null;
      }

      const start = Date.now();
      const snapshot = { ...(await resolveSnapshot(config)), ...override };
      const payload: PortalHeartbeatPayload = {
        clientId: config.clientId,
        clientName: config.clientName,
        applicationId: config.applicationId,
        applicationName: config.applicationName ?? config.portalName,
        portalName: config.portalName,
        portalUrl: config.portalUrl,
        environment: config.environment,
        status: snapshot.status ?? "live",
        message: snapshot.message,
        responseTimeMs: snapshot.responseTimeMs ?? Math.max(0, Date.now() - start),
        currentPath: snapshot.currentPath ?? defaultCurrentPath(),
        buildVersion: snapshot.buildVersion ?? config.buildVersion,
        checkedAt: new Date().toISOString(),
      };

      const response = await resolveFetch(config.fetcher)(config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(config.apiKey ? { "x-portal-ingest-key": config.apiKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Runtime status heartbeat failed (${response.status}).`);
      }

      return { payload };
    },
  };
}

export function usePortalHeartbeat(config?: PortalHeartbeatConfig): PortalHeartbeatState {
  const reporterRef = useRef<ReturnType<typeof createPortalStatusReporter> | null>(null);
  const configRef = useRef(config);
  const [state, setState] = useState<PortalHeartbeatState>({
    lastReportedAt: null,
    lastError: null,
    lastSnapshot: null,
  });

  configRef.current = config;
  reporterRef.current = config ? createPortalStatusReporter(config) : null;

  useEffect(() => {
    if (!config || config.enabled === false) {
      return;
    }

    let cancelled = false;

    async function sendHeartbeat() {
      try {
        const result = await reporterRef.current?.report();
        if (!cancelled && result) {
          setState({
            lastReportedAt: result.payload.checkedAt,
            lastError: null,
            lastSnapshot: result.payload,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown heartbeat error.";
        configRef.current?.onError?.(error instanceof Error ? error : new Error(message));
        if (!cancelled) {
          setState((current) => ({
            ...current,
            lastError: message,
          }));
        }
      }
    }

    void sendHeartbeat();

    const intervalId = window.setInterval(
      () => {
        void sendHeartbeat();
      },
      Math.max(config.intervalMs ?? 60_000, 10_000),
    );

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [config]);

  return state;
}
