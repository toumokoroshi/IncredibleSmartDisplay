import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { DisplayMode } from "../types/command";
import type { HeaderStatus } from "../types/dashboard";
import type { WidgetStatus } from "../types/widget";

type DashboardContextValue = {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  headerStatus: HeaderStatus;
  reportWidgetState: (widgetId: string, status: WidgetStatus, lastSyncedAt?: string) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: Pick<DashboardContextValue, "displayMode" | "setDisplayMode">;
}) {
  const [statuses, setStatuses] = useState<Record<string, WidgetStatus>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();

  const reportWidgetState = useCallback((widgetId: string, status: WidgetStatus, nextLastSyncedAt?: string) => {
    setStatuses((current) => {
      if (current[widgetId] === status) {
        return current;
      }
      return { ...current, [widgetId]: status };
    });

    if (nextLastSyncedAt) {
      setLastSyncedAt((current) => (current === nextLastSyncedAt ? current : nextLastSyncedAt));
    }
  }, []);

  const headerStatus = useMemo<HeaderStatus>(
    () => ({
      online: typeof navigator === "undefined" ? true : navigator.onLine,
      lastSyncedAt,
      refreshingCount: Object.values(statuses).filter((status) => status === "loading").length,
      errorCount: Object.values(statuses).filter((status) => status === "error").length,
      staleCount: Object.values(statuses).filter((status) => status === "stale").length,
    }),
    [lastSyncedAt, statuses],
  );

  const contextValue = useMemo(
    () => ({ ...value, headerStatus, reportWidgetState }),
    [headerStatus, reportWidgetState, value],
  );

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === null) {
    throw new Error("DashboardContext is not available");
  }
  return context;
}
