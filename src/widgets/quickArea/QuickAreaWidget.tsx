import { Card } from "../../components/Card";
import { useDashboardContext } from "../../contexts/DashboardContext";
import type { WidgetProps } from "../../types/widget";
import type { QuickAreaSettings } from "./types";

export function QuickAreaWidget({ config }: WidgetProps<QuickAreaSettings, unknown>) {
  const { displayMode, setDisplayMode } = useDashboardContext();
  const buttons = config.settings?.buttons ?? [];

  return (
    <Card>
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
      <div className="mt-4 grid grid-cols-5 gap-3">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className={`min-h-11 rounded-lg border px-4 py-3 text-base font-semibold ${
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
