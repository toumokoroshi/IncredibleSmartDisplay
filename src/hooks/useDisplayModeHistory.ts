import { useCallback, useEffect, useRef, useState } from "react";

import { DISPLAY_MODES, type DisplayMode } from "../types/command";

function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === "string" && (DISPLAY_MODES as readonly string[]).includes(value);
}

function readHistoryDisplayMode(state: unknown): DisplayMode {
  if (typeof state === "object" && state !== null && "displayMode" in state) {
    const candidate = (state as { displayMode: unknown }).displayMode;
    if (isDisplayMode(candidate)) {
      return candidate;
    }
  }
  return "home";
}

/**
 * Keeps displayMode in sync with the browser session history so browser back
 * (Alt+Left, the Android back gesture) closes a widget detail view instead of
 * leaving the app. Only detail views push a history entry; home stays on the
 * initial entry, so back-at-home still exits the page as usual.
 */
export function useDisplayModeHistory(defaultMode: DisplayMode): [DisplayMode, (mode: DisplayMode) => void] {
  const [displayMode, setDisplayModeState] = useState(defaultMode);
  const displayModeRef = useRef(displayMode);
  const hasPushedDetailEntryRef = useRef(false);

  useEffect(() => {
    displayModeRef.current = displayMode;
  }, [displayMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // A reload while a detail view was open (e.g. useAutoReload) leaves that
    // detail state on the current history entry while the app restarts on the
    // default mode. Clear it so back navigation cannot resurface a stale mode.
    if (readHistoryDisplayMode(window.history.state) !== "home") {
      window.history.replaceState(null, "");
    }

    const handlePopState = (event: PopStateEvent) => {
      const mode = readHistoryDisplayMode(event.state);
      hasPushedDetailEntryRef.current = mode !== "home";
      setDisplayModeState(mode);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    if (mode === displayModeRef.current) {
      return;
    }

    if (typeof window === "undefined") {
      setDisplayModeState(mode);
      return;
    }

    if (mode === "home") {
      if (hasPushedDetailEntryRef.current) {
        // Pop our own detail entry so history stays aligned with the UI; the
        // popstate handler applies the actual state change.
        window.history.back();
      } else {
        setDisplayModeState(mode);
      }
      return;
    }

    if (hasPushedDetailEntryRef.current) {
      // Detail-to-detail moves reuse the pushed entry so one back always
      // returns straight to home.
      window.history.replaceState({ displayMode: mode }, "");
    } else {
      window.history.pushState({ displayMode: mode }, "");
      hasPushedDetailEntryRef.current = true;
    }
    setDisplayModeState(mode);
  }, []);

  return [displayMode, setDisplayMode];
}
