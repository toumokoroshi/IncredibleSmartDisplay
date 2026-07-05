import { useEffect } from "react";

export function useAutoReload({ enabled, intervalMinutes }: { enabled: boolean; intervalMinutes: number }) {
  useEffect(() => {
    if (!enabled || intervalMinutes <= 0 || typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.reload();
    }, intervalMinutes * 60 * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [enabled, intervalMinutes]);
}

