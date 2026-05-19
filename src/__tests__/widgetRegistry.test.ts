import { describe, expect, it } from "vitest";

import { widgetRegistry } from "../registry/widgetRegistry";

describe("widget registry", () => {
  it("registers the MVP widgets", () => {
    expect(Object.keys(widgetRegistry)).toEqual(expect.arrayContaining(["weather", "calendar", "stocks", "news", "traffic", "quickArea"]));
  });
});
