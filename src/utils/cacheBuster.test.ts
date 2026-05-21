import { afterEach, describe, expect, it, vi } from "vitest";

import { appendCacheBuster } from "./cacheBuster";

describe("appendCacheBuster", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("appends a stable bucket for the requested interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("1970-01-01T00:10:30.000Z"));

    expect(appendCacheBuster("/data/news.json", 300)).toBe("/data/news.json?v=2");
  });

  it("uses an ampersand when the URL already has a query string", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("1970-01-01T00:10:30.000Z"));

    expect(appendCacheBuster("/data/news.json?source=local", 300)).toBe("/data/news.json?source=local&v=2");
  });

  it("leaves URLs unchanged when the interval is missing or disabled", () => {
    expect(appendCacheBuster("/data/news.json")).toBe("/data/news.json");
    expect(appendCacheBuster("/data/news.json", 0)).toBe("/data/news.json");
  });
});
