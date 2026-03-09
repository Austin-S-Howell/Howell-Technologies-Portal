import type { PortalHeartbeatConfig, PortalHeartbeatResult, PortalHeartbeatSnapshot, PortalHeartbeatState } from "./types";
export declare function createPortalStatusReporter(config: PortalHeartbeatConfig): {
    report(override?: PortalHeartbeatSnapshot): Promise<PortalHeartbeatResult | null>;
};
export declare function usePortalHeartbeat(config?: PortalHeartbeatConfig): PortalHeartbeatState;
