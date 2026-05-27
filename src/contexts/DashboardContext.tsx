import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { DisplayMode } from "../types/command";
import type { HeaderStatus } from "../types/dashboard";
import type { WidgetStatus } from "../types/widget";
import { summarizeHeaderStatus } from "../utils/headerStatus";

type DashboardContextValue = {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  headerStatus: HeaderStatus;
  reportWidgetState: (widgetId: string, status: WidgetStatus, lastSyncedAt?: string) => void;
  widgetStatuses: Record<string, WidgetStatus>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function getNavigatorOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function DashboardProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: Pick<DashboardContextValue, "displayMode" | "setDisplayMode">;
}) {
  const [statuses, setStatuses] = useState<Record<string, WidgetStatus>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();
  const [online, setOnline] = useState(getNavigatorOnline);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateOnline = () => {
      setOnline(getNavigatorOnline());
    };

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

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
    () => summarizeHeaderStatus({
      lastSyncedAt,
      online,
      statuses,
    }),
    [lastSyncedAt, online, statuses],
  );

  const contextValue = useMemo(
    () => ({ ...value, headerStatus, reportWidgetState, widgetStatuses: statuses }),
    [headerStatus, reportWidgetState, statuses, value],
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
