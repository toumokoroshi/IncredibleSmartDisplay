import type { ComponentType } from "react";
import type { ZodType } from "zod";
import type { DisplayMode } from "./command";

export type WidgetId = string;
export type WidgetType = "header" | "weather" | "calendar" | "stocks" | "news" | "traffic" | "petPhoto";
export type WidgetSize = "small" | "medium" | "large" | "wide";
export type DashboardArea =
  | "header"
  | "main-left"
  | "main-right"
  | "sub-left"
  | "sub-right"
  | "quick-area"
  | "detail";

export type WidgetStatus = "idle" | "loading" | "success" | "error" | "stale" | "offline";

export type WidgetErrorCode =
  | "NETWORK_ERROR"
  | "CORS_ERROR"
  | "API_RATE_LIMIT"
  | "AUTH_ERROR"
  | "DATA_EMPTY"
  | "DATA_INVALID"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";

export type WidgetError = {
  code: WidgetErrorCode;
  message: string;
  retryable?: boolean;
};

export type WidgetCachePolicy = "publicPersistent" | "privateNoStore";

export type WidgetConfig<TSettings = unknown> = {
  id: WidgetId;
  type: string;
  title: string;
  enabled: boolean;
  size: WidgetSize;
  refreshIntervalSec: number;
  order: number;
  area?: DashboardArea;
  settings?: TSettings;
};

export type WidgetDataResult<TData> = {
  data?: TData;
  status: WidgetStatus;
  lastFetchedAt?: string;
  error?: WidgetError;
  isEmpty?: boolean;
};

export type WidgetProps<TSettings = unknown, TData = unknown> = {
  config: WidgetConfig<TSettings>;
  data?: TData;
  status: WidgetStatus;
  error?: WidgetError;
  isEmpty?: boolean;
  isHighlighted?: boolean;
};

export type WidgetService<TSettings, TData> = {
  fetch(settings: TSettings): Promise<TData>;
};

export type WidgetDefinition<TSettings = unknown, TData = unknown> = {
  type: WidgetType;
  component: ComponentType<WidgetProps<TSettings, TData>>;
  settingsSchema: ZodType<TSettings>;
  createService?: () => WidgetService<TSettings, TData>;
  fallbackArea: DashboardArea;
  defaultRefreshIntervalSec: number;
  cacheTtlHours: number;
  validateData: (data: unknown) => data is TData;
  isEmpty: (data: TData) => boolean;
  getCachePolicy?: (settings: TSettings) => WidgetCachePolicy;
  detailDisplayMode?: DisplayMode;
};

export type AnyWidgetDefinition = WidgetDefinition<any, any>;
export type WidgetRegistry = Record<string, AnyWidgetDefinition>;
