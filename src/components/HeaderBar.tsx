import { formatDistanceToNowLabel, formatTimeLabel } from "../utils/date";
import type { HeaderStatus } from "../types/dashboard";

export function HeaderBar({ status, title }: { status: HeaderStatus; title: string }) {
  return (
    <header className="col-span-2 rounded-3xl border border-white/10 bg-slate-950/50 px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{title}</p>
          <p className="mt-2 text-[48px] font-semibold leading-none text-white">{formatTimeLabel(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-right text-sm text-slate-300">
          <StatusPill label={status.online ? "Online" : "Offline"} value={status.online ? "Connected" : "Disconnected"} />
          <StatusPill label="Refreshing" value={String(status.refreshingCount)} />
          <StatusPill label="Errors" value={String(status.errorCount)} />
          <StatusPill label="Stale" value={String(status.staleCount)} />
          <StatusPill
            label="Last Sync"
            value={status.lastSyncedAt ? formatDistanceToNowLabel(status.lastSyncedAt) : "Waiting"}
          />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}
