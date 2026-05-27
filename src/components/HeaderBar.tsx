import { House, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { formatHeaderDateLabel, formatTimeLabel } from "../utils/date";
import type { HeaderStatus } from "../types/dashboard";

export function HeaderBar({
  isDetailMode,
  locationName,
  onHomeClick,
  onRefreshClick,
  status,
}: {
  isDetailMode: boolean;
  locationName?: string;
  onHomeClick: () => void;
  onRefreshClick: () => void;
  status: HeaderStatus;
}) {
  const now = new Date();
  const syncLabel = status.lastSyncedAt ? `Updated ${formatTimeLabel(new Date(status.lastSyncedAt))}` : "Waiting";

  return (
    <header className="dashboard-header col-span-2 rounded-[var(--radius-card)] border border-[color:var(--panel-stroke)] bg-[var(--header-bg)] px-6 py-3 shadow-[var(--panel-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="app-clock text-[48px] font-semibold leading-none text-white">{formatTimeLabel(now)}</p>
          <p className="mt-2 text-sm font-semibold tracking-[0.04em] text-slate-500">{formatHeaderDateLabel(now)} · {locationName ?? "Tokyo"}</p>
        </div>
        <div className="status-grid flex flex-wrap items-start justify-end gap-2 text-right text-sm text-slate-300">
          {isDetailMode ? (
            <button
              type="button"
              className="home-command min-h-11 rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--panel-stroke)] bg-[var(--control-bg)] px-4 py-2 text-sm font-semibold text-slate-900"
              onClick={onHomeClick}
              aria-label="Home"
            >
              <House aria-hidden="true" className="inline-block align-[-0.2em]" size={20} strokeWidth={1.8} />
            </button>
          ) : null}
          <button
            type="button"
            className="home-command min-h-11 rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--panel-stroke)] bg-[var(--control-bg)] px-4 py-2 text-sm font-semibold text-slate-900"
            onClick={onRefreshClick}
            aria-label="Refresh"
          >
            <RefreshCw aria-hidden="true" className="inline-block align-[-0.2em]" size={20} strokeWidth={1.8} />
          </button>
          <QuietStatusPill>{syncLabel}</QuietStatusPill>
          <QuietStatusPill tone={status.online ? "ok" : "warn"}>{status.online ? "Online" : "Offline"}</QuietStatusPill>
          {status.refreshingCount > 0 ? <QuietStatusPill>Syncing {status.refreshingCount}</QuietStatusPill> : null}
          {status.errorCount > 0 ? <QuietStatusPill tone="warn">Issues {status.errorCount}</QuietStatusPill> : null}
          {status.staleCount > 0 ? <QuietStatusPill tone="warn">Stale {status.staleCount}</QuietStatusPill> : null}
        </div>
      </div>
    </header>
  );
}

function QuietStatusPill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "ok" | "warn" }) {
  const toneClass = tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-slate-600";

  return (
    <div className={`status-pill inline-flex min-h-9 items-center rounded-full border border-[color:var(--panel-stroke)] bg-[rgba(241,245,249,0.62)] px-3 py-1 text-base font-semibold ${toneClass}`}>
      {children}
    </div>
  );
}
