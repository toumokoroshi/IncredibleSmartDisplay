import { formatDistanceToNowLabel, formatHeaderDateLabel, formatTimeLabel } from "../utils/date";
import type { HeaderStatus } from "../types/dashboard";

export function HeaderBar({ locationName, status }: { locationName?: string; status: HeaderStatus }) {
  const now = new Date();
  const syncLabel = status.lastSyncedAt ? formatDistanceToNowLabel(status.lastSyncedAt) : "Waiting";

  return (
    <header className="dashboard-header col-span-2 rounded-[var(--radius-card)] border border-[color:var(--panel-stroke)] bg-[var(--header-bg)] px-6 py-3 shadow-[var(--panel-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="app-clock text-[48px] font-semibold leading-none text-white">{formatTimeLabel(now)}</p>
          <p className="mt-2 text-sm font-semibold tracking-[0.04em] text-slate-500">{formatHeaderDateLabel(now)} · {locationName ?? "Tokyo"}</p>
        </div>
        <div className="status-grid flex flex-wrap justify-end gap-2 text-right text-sm text-slate-300">
          <StatusPill label={status.online ? "Online" : "Offline"} value={status.online ? "Connected" : "Disconnected"} />
          <StatusPill label="Last Sync" value={syncLabel} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-pill min-w-28 rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--panel-stroke)] bg-[var(--control-bg)] px-3 py-2">
      <p className="status-label text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="status-value mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}
