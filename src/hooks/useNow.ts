import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 60_000;

export function useNow(intervalMs = DEFAULT_INTERVAL_MS) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return now;
}
