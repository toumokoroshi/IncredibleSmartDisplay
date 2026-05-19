import { z } from "zod";

import { QuickAreaWidget } from "./QuickAreaWidget";

export const quickAreaSettingsSchema = z.object({
  buttons: z.array(
    z.object({
      label: z.string(),
      displayMode: z.enum(["home", "weather", "calendar", "news", "traffic", "stocks", "smartHome", "system"]),
    }),
  ),
});

export const quickAreaDefinition = {
  type: "quickArea",
  component: QuickAreaWidget,
  settingsSchema: quickAreaSettingsSchema,
  fallbackArea: "quick-area",
  defaultRefreshIntervalSec: 0,
} as const;
