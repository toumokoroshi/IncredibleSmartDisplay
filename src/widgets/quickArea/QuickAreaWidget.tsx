import { HouseWifi } from "lucide-react";

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
            aria-pressed={displayMode === button.displayMode}
            className={`quick-command min-h-11 rounded-lg border px-4 py-2 text-base font-semibold ${
              displayMode === button.displayMode
                ? "border-[color:var(--accent-border)] bg-[var(--accent-bg)] text-white"
                : "border-[color:var(--panel-stroke)] bg-[var(--control-bg)] text-slate-200"
            }`}
            onClick={() => setDisplayMode(button.displayMode)}
          >
            {button.displayMode === "home" ? <HouseWifi className="mr-2 inline-block align-[-0.2em]" size={20} strokeWidth={1.8} /> : null}
            {button.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
