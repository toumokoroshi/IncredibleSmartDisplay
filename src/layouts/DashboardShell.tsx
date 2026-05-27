import { validateDashboardConfig } from "../config/validateConfig";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { HeaderBar } from "../components/HeaderBar";
import { UnknownWidget } from "../components/UnknownWidget";
import { useDashboardContext } from "../contexts/DashboardContext";
import { useAutoReload } from "../hooks/useAutoReload";
import { useMidnightRefresh } from "../hooks/useMidnightRefresh";
import { useOnlineRefresh } from "../hooks/useOnlineRefresh";
import { useWidgetData } from "../hooks/useWidgetData";
import { widgetRegistry } from "../registry/widgetRegistry";
import type { DisplayMode } from "../types/command";
import { dashboardConfig } from "../config/dashboard.config";
import { useQueryClient } from "@tanstack/react-query";
import { getWidgetQueryKey } from "../utils/widgetQuery";

function getHighlightedType(displayMode: string) {
  if (displayMode === "home") {
    return null;
  }
  return displayMode === "stocks" ? "stocks" : displayMode;
}

function getDetailModeForWidgetType(widgetType: string): DisplayMode | null {
  if (widgetType === "weather" || widgetType === "calendar" || widgetType === "news" || widgetType === "traffic" || widgetType === "petPhoto" || widgetType === "stocks") {
    return widgetType;
  }
  return null;
}

export function DashboardShell() {
  const { displayMode, headerStatus, setDisplayMode, widgetStatuses } = useDashboardContext();
  const queryClient = useQueryClient();
  const { widgets } = validateDashboardConfig();
  const highlightedType = getHighlightedType(displayMode);
  const weatherWidget = widgets.find((widget) => widget.type === "weather");
  const weatherSettings = weatherWidget?.settings as { locationName?: unknown } | undefined;
  const weatherLocationName = typeof weatherSettings?.locationName === "string" ? weatherSettings.locationName : undefined;
  const visibleWidgets = highlightedType === null ? widgets : widgets.filter((widget) => widget.type === highlightedType);
  useAutoReload(dashboardConfig.app.autoReload);
  useOnlineRefresh(widgets, widgetStatuses);
  useMidnightRefresh(widgets);

  const refreshVisibleWidgets = () => {
    for (const widget of visibleWidgets) {
      void queryClient.invalidateQueries({ queryKey: getWidgetQueryKey(widget.id) });
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--app-bg)] p-4 text-slate-100">
      <section className="dashboard-grid mx-auto grid h-[calc(100vh-2rem)] max-w-[1600px] gap-3">
        <HeaderBar
          isDetailMode={displayMode !== "home"}
          locationName={weatherLocationName}
          onHomeClick={() => setDisplayMode("home")}
          onRefreshClick={refreshVisibleWidgets}
          status={headerStatus}
        />
        {visibleWidgets.map((widget) => (
          <ErrorBoundary key={widget.id}>
            <WidgetSlot widget={widget} isHighlighted={highlightedType === widget.type} />
          </ErrorBoundary>
        ))}
      </section>
    </main>
  );
}

function WidgetSlot({
  widget,
  isHighlighted,
}: {
  widget: ReturnType<typeof validateDashboardConfig>["widgets"][number];
  isHighlighted: boolean;
}) {
  const definition = widgetRegistry[widget.type];
  const detailMode = getDetailModeForWidgetType(widget.type);
  const canOpenDetail = detailMode !== null && !isHighlighted;
  const { setDisplayMode } = useDashboardContext();

  if (definition === undefined) {
    return <UnknownWidget title={widget.title} type={widget.type} />;
  }

  return (
    <RegisteredWidgetSlot
      canOpenDetail={canOpenDetail}
      definition={definition}
      isHighlighted={isHighlighted}
      onOpenDetail={detailMode === null ? undefined : () => setDisplayMode(detailMode)}
      widget={widget}
    />
  );
}

function RegisteredWidgetSlot({
  canOpenDetail,
  definition,
  widget,
  isHighlighted,
  onOpenDetail,
}: {
  canOpenDetail: boolean;
  definition: (typeof widgetRegistry)[string];
  widget: ReturnType<typeof validateDashboardConfig>["widgets"][number];
  isHighlighted: boolean;
  onOpenDetail?: () => void;
}) {
  const { data, error, isEmpty, status } = useWidgetData(widget, definition);
  const Component = definition.component;
  const className = [
    "widget-slot widget-touch-wrapper min-h-0",
    `widget-${widget.type}`,
    widget.area ? `widget-area-${widget.area}` : "",
    isHighlighted ? "is-detail" : "",
    canOpenDetail ? "can-open-detail" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {/* Quick-look card taps are reserved for opening detail. Per-widget actions should live in detail views so future controls do not compete with card navigation. */}
      {canOpenDetail ? <button type="button" className="widget-detail-touch-target" aria-label={`${widget.title} detail`} onClick={onOpenDetail} /> : null}
      <Component
        config={widget}
        data={data}
        error={error}
        isHighlighted={isHighlighted}
        isEmpty={isEmpty}
        status={status}
      />
    </div>
  );
}
