export type TrafficLineConfig = {
  id: string;
  name: string;
  operator?: string;
  displayName?: string;
  priority?: number;
};

type TrafficBaseSettings = {
  maxItems: number;
  showLineUpdatedAt: boolean;
  // Local overrides let a kiosk device customize registered lines while the app remains statically hosted.
  allowLocalOverride: boolean;
};

export type MockTrafficSettings = TrafficBaseSettings & {
  provider: "mock";
  lines: TrafficLineConfig[];
};

export type StaticJsonTrafficSettings = TrafficBaseSettings & {
  provider: "staticJson";
  url: string;
  lines?: TrafficLineConfig[];
  cacheBusterIntervalSec?: number;
};

export type TrafficSettings = MockTrafficSettings | StaticJsonTrafficSettings;

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
  generatedAt?: string;
  lines: TrafficLineData[];
  updatedAt: string;
};
