import { z } from "zod";

import { createTrafficService } from "../../services/traffic/trafficService";
import { TrafficWidget } from "./TrafficWidget";

export const trafficSettingsSchema = z.object({
  provider: z.literal("mock"),
  lines: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        operator: z.string().optional(),
        displayName: z.string().optional(),
        priority: z.number().int().optional(),
      }),
    )
    .min(1),
  maxItems: z.number().int().positive(),
  showLineUpdatedAt: z.boolean(),
  allowLocalOverride: z.boolean(),
});

export const trafficDefinition = {
  type: "traffic",
  component: TrafficWidget,
  settingsSchema: trafficSettingsSchema,
  createService: createTrafficService,
  fallbackArea: "sub-left",
  defaultRefreshIntervalSec: 300,
} as const;
