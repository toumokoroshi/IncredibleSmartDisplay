import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useDisplayModeHistory } from "./useDisplayModeHistory";

describe("useDisplayModeHistory", () => {
  beforeEach(() => {
    window.history.replaceState(null, "");
  });

  it("starts from the default display mode", () => {
    const { result } = renderHook(() => useDisplayModeHistory("home"));

    expect(result.current[0]).toBe("home");
  });

  it("pushes a history entry when a detail view opens", () => {
    const { result } = renderHook(() => useDisplayModeHistory("home"));

    act(() => {
      result.current[1]("weather");
    });

    expect(result.current[0]).toBe("weather");
    expect(window.history.state).toEqual({ displayMode: "weather" });
  });

  it("returns to home when the browser navigates back", async () => {
    const { result } = renderHook(() => useDisplayModeHistory("home"));

    act(() => {
      result.current[1]("weather");
    });

    act(() => {
      window.history.back();
    });

    await waitFor(() => {
      expect(result.current[0]).toBe("home");
    });
    expect(window.history.state).toBeNull();
  });

  it("pops the pushed detail entry when the home command runs", async () => {
    const { result } = renderHook(() => useDisplayModeHistory("home"));

    act(() => {
      result.current[1]("news");
    });

    act(() => {
      result.current[1]("home");
    });

    await waitFor(() => {
      expect(result.current[0]).toBe("home");
    });
    expect(window.history.state).toBeNull();
  });

  it("replaces the entry when switching between detail views", async () => {
    const { result } = renderHook(() => useDisplayModeHistory("home"));

    act(() => {
      result.current[1]("weather");
    });
    act(() => {
      result.current[1]("news");
    });

    expect(result.current[0]).toBe("news");
    expect(window.history.state).toEqual({ displayMode: "news" });

    act(() => {
      window.history.back();
    });

    await waitFor(() => {
      expect(result.current[0]).toBe("home");
    });
  });

  it("falls back to home for unknown display modes in history state", () => {
    const { result } = renderHook(() => useDisplayModeHistory("home"));

    act(() => {
      result.current[1]("weather");
    });

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: { displayMode: "bogus" } }));
    });

    expect(result.current[0]).toBe("home");
  });

  it("clears stale detail state left behind by a reload", () => {
    window.history.replaceState({ displayMode: "traffic" }, "");

    const { result } = renderHook(() => useDisplayModeHistory("home"));

    expect(result.current[0]).toBe("home");
    expect(window.history.state).toBeNull();
  });
});
