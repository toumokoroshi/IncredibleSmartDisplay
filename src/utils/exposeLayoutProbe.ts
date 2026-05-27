import { collectLayoutProbeResults, getFailedLayoutProbes, type LayoutProbeRule } from "./layoutProbe";

declare global {
  interface Window {
    __layoutProbe?: {
      collect: typeof collectLayoutProbeResults;
      getFailed: typeof getFailedLayoutProbes;
    };
  }
}

export function exposeLayoutProbe() {
  if (import.meta.env.PROD || typeof window === "undefined") {
    return;
  }

  window.__layoutProbe = {
    collect: (rules: LayoutProbeRule[]) => collectLayoutProbeResults(rules),
    getFailed: getFailedLayoutProbes,
  };
}
