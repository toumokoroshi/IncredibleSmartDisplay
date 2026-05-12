import { Card } from "../../components/Card";
import { useDashboardContext } from "../../contexts/DashboardContext";
import type { WidgetProps } from "../../types/widget";
import type { QuickAreaSettings } from "./types";

export function QuickAreaWidget({ config }: WidgetProps<QuickAreaSettings, unknown>) {
  const { displayMode, setDisplayMode } = useDashboardContext();
  const buttons = config.settings?.buttons ?? [];

  return (
    <Card className="flex items-center gap-3 px-5 py-3">
      {/* Keep this as a thin command bar. Later these buttons should dispatch DashboardCommand objects so touch UI, Alexa, and webhooks share the same command path. */}
      <p className="min-w-16 text-xs uppercase tracking-[0.2em] text-slate-500">{config.title}</p>
      <div className="grid flex-1 grid-cols-5 gap-3">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className={`min-h-11 rounded-lg border px-4 py-2 text-base font-semibold ${
              displayMode === button.displayMode
                ? "border-cyan-300/60 bg-cyan-400/20 text-white"
                : "border-white/10 bg-white/5 text-slate-200"
            }`}
            onClick={() => setDisplayMode(button.displayMode)}
          >
            {button.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
