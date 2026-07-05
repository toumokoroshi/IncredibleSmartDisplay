import { describe, expect, it } from "vitest";

import { widgetRegistry } from "../registry/widgetRegistry";

describe("widget registry", () => {
  it("registers the MVP widgets", () => {
    expect(Object.keys(widgetRegistry)).toEqual(expect.arrayContaining(["weather", "calendar", "stocks", "news", "traffic", "petPhoto"]));
  });

  it("keeps detail display modes in widget definitions", () => {
    expect(widgetRegistry.weather.detailDisplayMode).toBe("weather");
    expect(widgetRegistry.calendar.detailDisplayMode).toBe("calendar");
    expect(widgetRegistry.news.detailDisplayMode).toBe("news");
    expect(widgetRegistry.traffic.detailDisplayMode).toBe("traffic");
    expect(widgetRegistry.petPhoto.detailDisplayMode).toBe("petPhoto");
    expect(widgetRegistry.stocks.detailDisplayMode).toBe("stocks");
  });
});
