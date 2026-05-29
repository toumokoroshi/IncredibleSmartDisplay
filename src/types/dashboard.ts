import type { DisplayMode } from "./command";
import type { WidgetConfig, WidgetStatus } from "./widget";

export type HeaderStatus = {
  online: boolean;
  lastSyncedAt?: string;
  refreshingCount: number;
  errorCount: number;
  staleCount: number;
};

export type DashboardConfig = {
  app: {
    name: string;
    locationName: string;
    locale: string;
    timezone: string;
    defaultDisplayMode: DisplayMode;
    autoReload: {
      enabled: boolean;
      intervalMinutes: number;
    };
  };
  layout: {
    type: string;
    gapPx: number;
    paddingPx: number;
  };
  theme: {
    mode: "dark" | "light";
    density: "compact" | "comfortable";
    fontScale: number;
    enableBurnInProtection: boolean;
  };
  widgets: WidgetConfig[];
  commands: {
    enabled: boolean;
    acceptedSources: string[];
    defaultTimeoutSec: number;
  };
};

export type WidgetStatusMap = Record<string, WidgetStatus>;
