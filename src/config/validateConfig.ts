import { z } from "zod";

import { widgetRegistry } from "../registry/widgetRegistry";
import type { WidgetConfig } from "../types/widget";
import { dashboardConfig } from "./dashboard.config";

const areaSchema = z.enum(["header", "main-left", "main-right", "sub-left", "sub-right", "detail"]);

const baseWidgetSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  enabled: z.boolean(),
  size: z.enum(["small", "medium", "large", "wide"]),
  refreshIntervalSec: z.number(),
  order: z.number(),
  area: areaSchema.optional(),
  settings: z.unknown().optional(),
});

export type ConfigValidationWarning = {
  code: string;
  widgetId: string;
  field: string;
};

export type ValidatedWidgetConfig = WidgetConfig<unknown> & {
  settingsError?: string;
  unknownType?: boolean;
};

export type ValidationResult = {
  widgets: ValidatedWidgetConfig[];
  warnings: ConfigValidationWarning[];
};

export function validateDashboardConfig(): ValidationResult {
  const warnings: ConfigValidationWarning[] = [];
  const seenIds = new Set<string>();

  const widgets = dashboardConfig.widgets
    .map((widget, index) => {
      const parsed = baseWidgetSchema.safeParse(widget);
      if (!parsed.success) {
        warnings.push({ code: "INVALID_WIDGET_SHAPE", widgetId: widget.id ?? `index-${index}`, field: "widget" });
        return null;
      }

      const nextWidget: ValidatedWidgetConfig = { ...parsed.data };
      const definition = widgetRegistry[nextWidget.type];

      if (seenIds.has(nextWidget.id)) {
        warnings.push({ code: "DUPLICATE_WIDGET_ID", widgetId: nextWidget.id, field: "id" });
      }
      seenIds.add(nextWidget.id);

      if (!definition) {
        warnings.push({ code: "UNKNOWN_WIDGET_TYPE", widgetId: nextWidget.id, field: "type" });
        return { ...nextWidget, unknownType: true };
      }

      if (nextWidget.refreshIntervalSec < 0) {
        warnings.push({ code: "INVALID_REFRESH_INTERVAL", widgetId: nextWidget.id, field: "refreshIntervalSec" });
        nextWidget.refreshIntervalSec = definition.defaultRefreshIntervalSec;
      }

      if (!nextWidget.area || !areaSchema.safeParse(nextWidget.area).success) {
        warnings.push({ code: "INVALID_WIDGET_AREA", widgetId: nextWidget.id, field: "area" });
        nextWidget.area = definition.fallbackArea;
      }

      const settingsResult = definition.settingsSchema.safeParse(nextWidget.settings);
      if (!settingsResult.success) {
        warnings.push({ code: "INVALID_WIDGET_SETTINGS", widgetId: nextWidget.id, field: "settings" });
        nextWidget.settingsError = "Invalid widget settings";
      }

      return nextWidget;
    })
    .filter((widget): widget is ValidatedWidgetConfig => Boolean(widget))
    .filter((widget) => widget.enabled)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

  for (const warning of warnings) {
    console.warn("[dashboard-config]", warning);
  }

  return { widgets, warnings };
}
