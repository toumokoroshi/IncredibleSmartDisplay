import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { WidgetConfig } from "../types/widget";
import { getWidgetQueryKey } from "../utils/widgetQuery";

const MIDNIGHT_REFRESH_TYPES = new Set(["weather", "calendar"]);

function getMsUntilNextMidnight(now = new Date()) {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

export function useMidnightRefresh(widgets: Pick<WidgetConfig, "id" | "type">[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let timeoutId: number | undefined;

    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        for (const widget of widgets) {
          if (MIDNIGHT_REFRESH_TYPES.has(widget.type)) {
            void queryClient.invalidateQueries({ queryKey: getWidgetQueryKey(widget.id) });
          }
        }
        schedule();
      }, getMsUntilNextMidnight());
    };

    schedule();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [queryClient, widgets]);
}

