import { useMemo } from "react";

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
import { dashboardConfig } from "../config/dashboard.config";
import type { DisplayMode } from "../types/command";

function resolveHighlightedType(displayMode: DisplayMode) {
  if (displayMode === "home") {
    return null;
  }

  const entry = Object.entries(widgetRegistry).find(([, definition]) => definition.detailDisplayMode === displayMode);
  return entry?.[0] ?? null;
}

export function DashboardShell() {
  const { displayMode, executeCommand, headerStatus, widgetStatuses } = useDashboardContext();
  const { widgets } = useMemo(() => validateDashboardConfig(), []);
  const highlightedType = resolveHighlightedType(displayMode);
  const visibleWidgets = highlightedType === null ? widgets : widgets.filter((widget) => widget.type === highlightedType);
  useAutoReload(dashboardConfig.app.autoReload);
  useOnlineRefresh(widgets, widgetStatuses);
  useMidnightRefresh(widgets);

  const refreshVisibleWidgets = () => {
    executeCommand({ type: "REFRESH_WIDGETS", widgetIds: visibleWidgets.map((widget) => widget.id) });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--app-bg)] p-4 text-slate-100">
      <section className="dashboard-grid mx-auto grid h-[calc(100vh-2rem)] max-w-[1600px] gap-3">
        <HeaderBar
          isDetailMode={displayMode !== "home"}
          locationName={dashboardConfig.app.locationName}
          onHomeClick={() => executeCommand({ type: "SET_DISPLAY_MODE", mode: "home" })}
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
  const detailMode = definition?.detailDisplayMode;
  const canOpenDetail = detailMode !== undefined && !isHighlighted;
  const { executeCommand } = useDashboardContext();

  if (definition === undefined) {
    return <UnknownWidget title={widget.title} type={widget.type} />;
  }

  return (
    <RegisteredWidgetSlot
      canOpenDetail={canOpenDetail}
      definition={definition}
      isHighlighted={isHighlighted}
      onOpenDetail={detailMode === undefined ? undefined : () => executeCommand({ type: "SET_DISPLAY_MODE", mode: detailMode })}
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
