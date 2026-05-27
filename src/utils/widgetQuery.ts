export function getWidgetQueryKey(widgetId: string) {
  return ["widget-data", widgetId] as const;
}

