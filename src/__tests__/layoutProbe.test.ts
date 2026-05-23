import { describe, expect, it } from "vitest";

import { collectLayoutProbeResults, getFailedLayoutProbes } from "../utils/layoutProbe";

function setBoxMetrics(element: HTMLElement, metrics: { clientHeight: number; clientWidth: number; scrollHeight: number; scrollWidth: number }) {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: metrics.clientHeight },
    clientWidth: { configurable: true, value: metrics.clientWidth },
    scrollHeight: { configurable: true, value: metrics.scrollHeight },
    scrollWidth: { configurable: true, value: metrics.scrollWidth },
  });
}

describe("layoutProbe", () => {
  it("detects missing, vertical overflow, and horizontal overflow", () => {
    const root = document.createElement("div");
    const ok = document.createElement("section");
    const tall = document.createElement("section");
    const wide = document.createElement("section");
    ok.className = "ok";
    tall.className = "tall";
    wide.className = "wide";
    root.append(ok, tall, wide);

    setBoxMetrics(ok, { clientHeight: 100, clientWidth: 100, scrollHeight: 101, scrollWidth: 100 });
    setBoxMetrics(tall, { clientHeight: 100, clientWidth: 100, scrollHeight: 108, scrollWidth: 100 });
    setBoxMetrics(wide, { clientHeight: 100, clientWidth: 100, scrollHeight: 100, scrollWidth: 112 });

    const results = collectLayoutProbeResults([
      { selector: ".ok" },
      { selector: ".tall" },
      { selector: ".wide" },
      { selector: ".missing" },
    ], root);

    expect(results.find((result) => result.selector === ".ok")?.verticalOverflow).toBe(false);
    expect(results.find((result) => result.selector === ".tall")?.verticalOverflow).toBe(true);
    expect(results.find((result) => result.selector === ".wide")?.horizontalOverflow).toBe(true);
    expect(results.find((result) => result.selector === ".missing")?.missing).toBe(true);
    expect(getFailedLayoutProbes(results)).toHaveLength(3);
  });

  it("allows horizontal overflow for explicit scroll regions", () => {
    const root = document.createElement("div");
    const scrollRegion = document.createElement("section");
    scrollRegion.className = "scroll-region";
    root.append(scrollRegion);

    setBoxMetrics(scrollRegion, { clientHeight: 100, clientWidth: 100, scrollHeight: 100, scrollWidth: 300 });

    const [result] = collectLayoutProbeResults([{ allowHorizontalOverflow: true, selector: ".scroll-region" }], root);

    expect(result?.horizontalOverflow).toBe(false);
    expect(getFailedLayoutProbes(result ? [result] : [])).toHaveLength(0);
  });
});
