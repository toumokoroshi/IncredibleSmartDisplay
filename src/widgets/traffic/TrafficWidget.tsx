import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MaterialSymbolIcon } from "../../components/MaterialSymbolIcon";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { TrafficData, TrafficLineData, TrafficSettings } from "./types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getStatusLabel(line: TrafficLineData) {
  if (line.status === "delayed" && typeof line.delayMinutes === "number") {
    return `+${line.delayMinutes}`;
  }

  if (line.status === "partiallyDelayed") {
    return "一部";
  }

  if (line.status === "suspended") {
    return "停止";
  }

  if (line.status === "normal") {
    return "OK";
  }

  return "確認";
}

function getStatusClass(line: TrafficLineData) {
  switch (line.status) {
    case "normal":
      return "bg-emerald-500/12 text-emerald-700";
    case "delayed":
    case "suspended":
      return "bg-red-500/12 text-red-700";
    case "partiallyDelayed":
      return "bg-amber-400/25 text-amber-700";
    default:
      return "bg-slate-500/15 text-slate-600";
  }
}

function getSummary(lines: TrafficLineData[]) {
  const affected = lines.filter((line) => line.status !== "normal").length;
  const normal = lines.length - affected;
  if (affected === 0) {
    return {
      primaryLabel: `通常 ${normal}/${lines.length}`,
      secondaryLabel: `異常 ${affected}/${lines.length}`,
      className: "text-emerald-700",
    };
  }
  const hasSuspended = lines.some((line) => line.status === "suspended");
  return {
    primaryLabel: `${hasSuspended ? "見合わせ" : "遅延"} ${affected}/${lines.length}`,
    secondaryLabel: `通常 ${normal}/${lines.length}`,
    className: "text-red-700",
  };
}

function getCounts(lines: TrafficLineData[]) {
  const suspended = lines.filter((line) => line.status === "suspended").length;
  const affected = lines.filter((line) => line.status !== "normal").length;
  const normal = lines.length - affected;
  return { affected, normal, suspended, total: lines.length };
}

function getDetailStatusLabel(line: TrafficLineData) {
  if (line.status === "delayed" && typeof line.delayMinutes === "number") {
    return `遅延 +${line.delayMinutes}分`;
  }
  if (line.status === "partiallyDelayed") {
    return "一部遅延";
  }
  if (line.status === "suspended") {
    return "運転見合わせ";
  }
  if (line.status === "normal") {
    return "通常";
  }
  return "要確認";
}

export function TrafficWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<TrafficSettings, TrafficData>) {
  const maxItems = config.settings?.maxItems ?? 8;
  const lines = data?.lines.slice(0, maxItems) ?? [];
  const summary = getSummary(lines);
  const counts = getCounts(lines);

  return (
    <Card className={`traffic-card-compact ${isHighlighted ? "traffic-detail-card ring-2 ring-cyan-400/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="widget-heading flex items-center gap-3">
          <span className="widget-heading-icon">
            <MaterialSymbolIcon name="train" />
          </span>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          {status === "stale" ? <StaleBadge /> : null}
          {data?.updatedAt ? <span>{formatTime(data.updatedAt)}</span> : null}
        </div>
      </div>

      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {isEmpty ? <EmptyState /> : null}
      {data && status !== "error" && status !== "loading" && !isEmpty && isHighlighted ? (
        <TrafficDetail
          counts={counts}
          lines={lines}
          summary={summary}
          updatedAt={data.updatedAt}
        />
      ) : null}
      {data && status !== "error" && status !== "loading" && !isEmpty && !isHighlighted ? (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
            <strong className={`text-[21px] font-semibold leading-none ${summary.className}`}>{summary.primaryLabel}</strong>
            <span className="text-[13px] font-bold text-slate-500">{summary.secondaryLabel}</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_48px_58px] items-center gap-2 pt-1 text-[10px] font-bold tracking-[0.08em] text-slate-500">
            <span>路線</span>
            <span className="text-center">更新</span>
            <span className="text-center">状態</span>
          </div>
          <ul className="mt-1 grid min-h-0">
            {lines.map((line) => (
              <li
                key={line.id}
                className="grid min-h-[22px] grid-cols-[minmax(0,1fr)_48px_58px] items-center gap-2 border-b border-slate-200 py-0.5"
              >
                <p className="truncate text-sm font-medium text-slate-950">{line.name}</p>
                <span className="text-center text-[11px] font-bold text-slate-500">{formatTime(line.updatedAt)}</span>
                <span className={`rounded-full px-2 py-0.5 text-center text-[11px] font-extrabold ${getStatusClass(line)}`}>
                  {getStatusLabel(line)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Card>
  );
}

function TrafficDetail({
  counts,
  lines,
  summary,
  updatedAt,
}: {
  counts: ReturnType<typeof getCounts>;
  lines: TrafficLineData[];
  summary: ReturnType<typeof getSummary>;
  updatedAt: string;
}) {
  const affectedLines = lines.filter((line) => line.status !== "normal");

  return (
    <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1.2fr_0.8fr] grid-rows-[auto_minmax(0,1fr)] gap-4">
      <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div>
          <p className={`text-3xl font-semibold leading-none ${summary.className}`}>
            {summary.primaryLabel}・{summary.secondaryLabel}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">登録路線の運行状況を中心に表示</p>
        </div>
        <div className="grid min-w-[520px] grid-cols-4 gap-2">
          <TrafficMetric label="遅延" value={`${counts.affected}/${counts.total}`} tone={counts.affected > 0 ? "warn" : "default"} />
          <TrafficMetric label="見合わせ" value={`${counts.suspended}/${counts.total}`} tone={counts.suspended > 0 ? "warn" : "default"} />
          <TrafficMetric label="通常" value={`${counts.normal}/${counts.total}`} tone="ok" />
          <TrafficMetric label="更新" value={formatTime(updatedAt)} />
        </div>
      </div>

      <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
        <h2 className="text-lg font-semibold text-slate-700">重要な影響</h2>
        <div className="grid min-h-0 grid-cols-2 gap-3">
          {affectedLines.length > 0 ? (
            affectedLines.slice(0, 2).map((line) => (
              <section key={line.id} className="grid content-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-2xl font-semibold text-slate-950">{line.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${getStatusClass(line)}`}>{getDetailStatusLabel(line)}</span>
                  <span className="rounded-full bg-amber-400/25 px-3 py-1 text-sm font-extrabold text-amber-700">
                    {formatTime(line.updatedAt)}更新
                  </span>
                </div>
                <div className="grid gap-2 text-base">
                  <TrafficDetailRow label="影響区間" value={line.detail ?? "-"} />
                  <TrafficDetailRow label="理由" value={line.reason ?? "-"} />
                  <TrafficDetailRow label="復旧見込み" value={line.recoveryEstimate ?? "未定"} />
                  <TrafficDetailRow label="振替輸送" value={line.alternateTransport ?? "-"} />
                </div>
              </section>
            ))
          ) : (
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 text-xl font-semibold text-emerald-700">
              登録路線はすべて通常運行です
            </div>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-600">
          <div>
            <strong className="block text-base text-slate-700">登録駅の次発情報</strong>
            駅別発車案内は便利ですが、データ鮮度とAPI制約が別なので後続フェーズで別データとして追加します。
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-extrabold text-slate-700">Phase 4</span>
        </div>
      </section>

      <section className="min-h-0 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-700">登録路線一覧</h2>
        <div className="mt-3 grid">
          <div className="grid min-h-7 grid-cols-[minmax(0,1fr)_58px_54px_96px] items-center gap-2 text-[11px] font-extrabold tracking-[0.08em] text-slate-500">
            <span>路線</span>
            <span className="text-center">状態</span>
            <span className="text-center">更新</span>
            <span className="text-right">影響</span>
          </div>
          {lines.map((line) => (
            <div key={line.id} className="grid min-h-[34px] grid-cols-[minmax(0,1fr)_58px_54px_96px] items-center gap-2 border-b border-slate-200 text-sm">
              <span className="truncate font-medium text-slate-950">{line.name}</span>
              <span className={`text-center font-extrabold ${line.status === "normal" ? "text-emerald-700" : "text-red-700"}`}>
                {getStatusLabel(line)}
              </span>
              <span className="text-center font-semibold text-slate-500">{formatTime(line.updatedAt)}</span>
              <span className="truncate text-right font-semibold text-slate-500">{line.detail ?? "-"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TrafficMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "ok" | "warn" }) {
  const valueClass = tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-red-700" : "text-slate-950";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="block text-[11px] font-extrabold tracking-[0.08em] text-slate-500">{label}</span>
      <strong className={`mt-1 block text-[22px] leading-none ${valueClass}`}>{value}</strong>
    </div>
  );
}

function TrafficDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-2">
      <span className="font-bold text-slate-500">{label}</span>
      <strong className="min-w-0 text-slate-950">{value}</strong>
    </div>
  );
}
