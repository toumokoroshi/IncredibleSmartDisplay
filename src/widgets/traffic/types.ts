export type TrafficLineConfig = {
  id: string;
  name: string;
  operator?: string;
  displayName?: string;
  priority?: number;
};

export type TrafficSettings = {
  provider: "mock";
  lines: TrafficLineConfig[];
  maxItems: number;
  showLineUpdatedAt: boolean;
  // Local overrides let a kiosk device customize registered lines while the app remains statically hosted.
  allowLocalOverride: boolean;
};

export type TrafficLineStatus = "normal" | "delayed" | "partiallyDelayed" | "suspended" | "unknown";

export type TrafficLineData = {
  id: string;
  name: string;
  operator?: string;
  status: TrafficLineStatus;
  updatedAt: string;
  delayMinutes?: number;
  statusText?: string;
  detail?: string;
  reason?: string;
  recoveryEstimate?: string;
  alternateTransport?: string;
};

export type TrafficData = {
  lines: TrafficLineData[];
  updatedAt: string;
};
