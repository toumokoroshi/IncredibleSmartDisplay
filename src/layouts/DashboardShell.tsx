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

  return (
    <main className="min-h-screen overflow-hidden p-4 text-slate-100">
      <section className="mx-auto grid h-[calc(100vh-2rem)] max-w-[1600px] grid-cols-2 grid-rows-[10fr_42fr_34fr_14fr] gap-3">
        <HeaderBar status={headerStatus} title="Living Dashboard" />
        {widgets.map((widget) => (
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
  const className =
    widget.area === "quick-area"
      ? "col-span-2"
      : widget.area === "main-left" || widget.area === "main-right"
        ? "min-h-0"
        : "min-h-0";

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
