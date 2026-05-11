export type WidgetCacheRecord<TData> = {
  data: TData;
  fetchedAt: string;
  expiresAt: string;
  schemaVersion: number;
};

const SCHEMA_VERSION = 1;

export function readWidgetCache<TData>(widgetId: string) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(`widget-cache:${widgetId}`);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as WidgetCacheRecord<TData>;
    if (parsed.schemaVersion !== SCHEMA_VERSION || !parsed.data) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeWidgetCache<TData>(widgetId: string, data: TData, ttlHours: number) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const now = Date.now();
  const record: WidgetCacheRecord<TData> = {
    data,
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlHours * 60 * 60 * 1000).toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };

  localStorage.setItem(`widget-cache:${widgetId}`, JSON.stringify(record));
}

export function isCacheExpired(record: WidgetCacheRecord<unknown>) {
  return new Date(record.expiresAt).getTime() < Date.now();
}
