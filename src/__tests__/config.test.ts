import { describe, expect, it } from "vitest";

import { dashboardConfig } from "../config/dashboard.config";
import { validateDashboardConfig } from "../config/validateConfig";
import { widgetRegistry } from "../registry/widgetRegistry";

describe("config validation", () => {
  it("has enabled widgets resolvable in registry", () => {
    const enabledWidgets = dashboardConfig.widgets.filter((widget) => widget.enabled);
    expect(enabledWidgets.every((widget) => widget.type in widgetRegistry || widget.type === "quickArea")).toBe(true);
  });

  it("falls back invalid refreshIntervalSec", () => {
    const original = dashboardConfig.widgets[0].refreshIntervalSec;
    dashboardConfig.widgets[0].refreshIntervalSec = -1;

    const result = validateDashboardConfig();

    expect(result.widgets[0].refreshIntervalSec).toBeGreaterThanOrEqual(0);
    dashboardConfig.widgets[0].refreshIntervalSec = original;
  });
});
