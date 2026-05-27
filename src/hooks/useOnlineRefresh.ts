import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { WidgetStatusMap } from "../types/dashboard";
import type { WidgetConfig } from "../types/widget";
import { getWidgetQueryKey } from "../utils/widgetQuery";

const REFRESH_ONLINE_STATUSES = new Set(["error", "stale", "offline"]);

export function useOnlineRefresh(widgets: Pick<WidgetConfig, "id">[], statuses: WidgetStatusMap) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
      for (const widget of widgets) {
        if (REFRESH_ONLINE_STATUSES.has(statuses[widget.id])) {
          void queryClient.invalidateQueries({ queryKey: getWidgetQueryKey(widget.id) });
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient, statuses, widgets]);
}

