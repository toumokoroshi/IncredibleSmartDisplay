import type { HeaderStatus } from "../types/dashboard";
import type { WidgetStatus } from "../types/widget";

export function summarizeHeaderStatus({
  lastSyncedAt,
  online,
  statuses,
}: {
  lastSyncedAt?: string;
  online: boolean;
  statuses: Record<string, WidgetStatus>;
}): HeaderStatus {
  const values = Object.values(statuses);

  return {
    online,
    lastSyncedAt,
    refreshingCount: values.filter((status) => status === "loading").length,
    errorCount: values.filter((status) => status === "error").length,
    staleCount: values.filter((status) => status === "stale").length,
  };
}
