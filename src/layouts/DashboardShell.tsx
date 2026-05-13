import { validateDashboardConfig } from "../config/validateConfig";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { HeaderBar } from "../components/HeaderBar";
import { UnknownWidget } from "../components/UnknownWidget";
import { useDashboardContext } from "../contexts/DashboardContext";
import { useWidgetData } from "../hooks/useWidgetData";
import { widgetRegistry } from "../registry/widgetRegistry";

function getHighlightedType(displayMode: string) {
  if (displayMode === "home") {
    return null;
  }
  return displayMode === "stocks" ? "stocks" : displayMode;
}

export function DashboardShell() {
  const { displayMode, headerStatus } = useDashboardContext();
  const { widgets } = validateDashboardConfig();
  const highlightedType = getHighlightedType(displayMode);
  const visibleWidgets =
    highlightedType === null ? widgets : widgets.filter((widget) => widget.type === highlightedType || widget.area === "quick-area");

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--app-bg)] p-4 text-slate-100">
      <section className="dashboard-grid mx-auto grid h-[calc(100vh-2rem)] max-w-[1600px] gap-3">
        <HeaderBar status={headerStatus} title="Living Dashboard" />
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

  if (definition === undefined) {
    return <UnknownWidget title={widget.title} type={widget.type} />;
  }

  return <RegisteredWidgetSlot definition={definition} isHighlighted={isHighlighted} widget={widget} />;
}

function RegisteredWidgetSlot({
  definition,
  widget,
  isHighlighted,
}: {
  definition: (typeof widgetRegistry)[string];
  widget: ReturnType<typeof validateDashboardConfig>["widgets"][number];
  isHighlighted: boolean;
}) {
  const { data, error, isEmpty, status } = useWidgetData(widget, definition);
  const Component = definition.component;
  const className = [
    "widget-slot min-h-0",
    `widget-${widget.type}`,
    widget.area ? `widget-area-${widget.area}` : "",
    isHighlighted && widget.area !== "quick-area" ? "is-detail" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
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
