import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNow } from "./useNow";

describe("useNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T08:00:00.000+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current time at mount", () => {
    const { result } = renderHook(() => useNow());

    expect(result.current).toEqual(new Date("2026-05-31T08:00:00.000+09:00"));
  });

  it("advances after the polling interval elapses", () => {
    const { result } = renderHook(() => useNow(60_000));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toEqual(new Date("2026-05-31T08:01:00.000+09:00"));
  });

  it("does not advance before the polling interval elapses", () => {
    const { result } = renderHook(() => useNow(60_000));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current).toEqual(new Date("2026-05-31T08:00:00.000+09:00"));
  });
});
