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
  z.object({
    ...trafficBaseSettingsSchema,
    lines: z.array(trafficLineConfigSchema).optional(),
    provider: z.literal("workerJson"),
    url: z.string().min(1),
  }),
]);

const trafficDataSchema: z.ZodType<TrafficData> = z.object({
  generatedAt: z
    .string()
    .refine((value) => Number.isNaN(Date.parse(value)) === false)
    .optional(),
  updatedAt: z.string().refine((value) => Number.isNaN(Date.parse(value)) === false),
  lines: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      operator: z.string().optional(),
      status: z.enum(["normal", "delayed", "partiallyDelayed", "suspended", "unknown"]),
      updatedAt: z.string().refine((value) => Number.isNaN(Date.parse(value)) === false),
      delayMinutes: z.number().optional(),
      statusText: z.string().optional(),
      detail: z.string().optional(),
      reason: z.string().optional(),
      recoveryEstimate: z.string().optional(),
      alternateTransport: z.string().optional(),
    }),
  ),
});

export const trafficDefinition = {
  type: "traffic",
  component: TrafficWidget,
  settingsSchema: trafficSettingsSchema,
  createService: createTrafficService,
  fallbackArea: "sub-left",
  defaultRefreshIntervalSec: 300,
  cacheTtlHours: 1,
  validateData: (data: unknown): data is TrafficData => trafficDataSchema.safeParse(data).success,
  isEmpty: (data: TrafficData) => data.lines.length === 0,
  detailDisplayMode: "traffic",
} as const;
