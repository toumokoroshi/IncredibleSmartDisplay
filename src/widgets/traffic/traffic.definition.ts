import { z } from "zod";

import { createTrafficService } from "../../services/traffic/trafficService";
import { TrafficWidget } from "./TrafficWidget";
import type { TrafficData } from "./types";

const trafficLineConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  operator: z.string().optional(),
  displayName: z.string().optional(),
  priority: z.number().int().optional(),
});

const trafficBaseSettingsSchema = {
  maxItems: z.number().int().positive(),
  showLineUpdatedAt: z.boolean(),
  allowLocalOverride: z.boolean(),
};

export const trafficSettingsSchema = z.discriminatedUnion("provider", [
  z.object({
    ...trafficBaseSettingsSchema,
    provider: z.literal("mock"),
    lines: z.array(trafficLineConfigSchema).min(1),
  }),
  z.object({
    ...trafficBaseSettingsSchema,
    cacheBusterIntervalSec: z.number().int().positive().optional(),
    lines: z.array(trafficLineConfigSchema).optional(),
    provider: z.literal("staticJson"),
    url: z.string().min(1),
  }),
]);

export const trafficDefinition = {
  type: "traffic",
  component: TrafficWidget,
  settingsSchema: trafficSettingsSchema,
  createService: createTrafficService,
  fallbackArea: "sub-left",
  defaultRefreshIntervalSec: 300,
  cacheTtlHours: 1,
  isEmpty: (data: TrafficData) => data.lines.length === 0,
} as const;
