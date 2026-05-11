import type { DisplayMode } from "../../types/command";

export type QuickAreaSettings = {
  buttons: Array<{
    label: string;
    displayMode: DisplayMode;
  }>;
};
