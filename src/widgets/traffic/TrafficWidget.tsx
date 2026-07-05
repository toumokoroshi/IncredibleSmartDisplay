import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MaterialSymbolIcon } from "../../components/MaterialSymbolIcon";
import { StaleBadge } from "../../components/StaleBadge";
import { formatHourMinuteLabel as formatTime } from "../../utils/date";
import type { WidgetProps } from "../../types/widget";
import type { TrafficData, TrafficLineData, TrafficSettings } from "./types";

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
      return "bg-emerald-100 text-emerald-700";
    case "delayed":
      return "bg-amber-100 text-amber-700";
    case "suspended":
      return "bg-red-100 text-red-700";
    case "partiallyDelayed":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-200 text-slate-600";
  }
}

function getSummary(lines: TrafficLineData[]) {
  const counts = getCounts(lines);
  const affected = counts.affected;
  const normal = counts.normal;
  if (affected === 0) {
    return {
      primaryLabel: `通常 ${normal}/${lines.length}`,
      secondaryLabel: `異常 ${affected}/${lines.length}`,
      className: "text-emerald-700",
    };
  }
  const hasSuspended = counts.suspended > 0;
  const hasUnknown = counts.unknown > 0 && counts.delayed === 0 && counts.suspended === 0;
  return {
    primaryLabel: `${hasSuspended ? "見合わせ" : hasUnknown ? "未確認" : "遅延"} ${affected}/${lines.length}`,
    secondaryLabel: `通常 ${normal}/${lines.length}`,
    className: hasSuspended ? "text-red-700" : hasUnknown ? "text-slate-600" : "text-amber-700",
  };
}

function getCounts(lines: TrafficLineData[]) {
  const delayed = lines.filter((line) => line.status === "delayed" || line.status === "partiallyDelayed").length;
  const suspended = lines.filter((line) => line.status === "suspended").length;
  const unknown = lines.filter((line) => line.status === "unknown").length;
  const affected = lines.filter((line) => line.status !== "normal").length;
  const normal = lines.length - affected;
  return { affected, delayed, normal, suspended, total: lines.length, unknown };
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

function getTrafficSeverity(counts: ReturnType<typeof getCounts>) {
  if (counts.suspended > 0) {
    return "suspended";
  }

  if (counts.delayed > 0) {
    return "delayed";
  }

  if (counts.unknown > 0) {
    return "unknown";
  }

  return "normal";
}

function getDetailHeadline(counts: ReturnType<typeof getCounts>) {
  const severity = getTrafficSeverity(counts);

  if (severity === "suspended") {
    return `${counts.suspended}路線で運転見合わせ`;
  }

  if (severity === "delayed") {
    return `${counts.affected}路線に影響。見合わせなし`;
  }

  if (severity === "unknown") {
    return `${counts.unknown}路線が未確認。前回情報を表示`;
  }

  return "登録路線はすべて通常運行";
}

function getActionSummary(counts: ReturnType<typeof getCounts>) {
  const severity = getTrafficSeverity(counts);

  if (severity === "suspended") {
    return "経路変更を確認してください。";
  }

  if (severity === "delayed") {
    return "出発時刻に余裕を持ってください。";
  }

  if (severity === "unknown") {
    return "データ鮮度に注意してください。";
  }

  return "通常どおり移動できます。";
}

function getSeverityClasses(severity: ReturnType<typeof getTrafficSeverity>) {
  if (severity === "suspended") {
    return {
      action: "border-red-600/20 text-slate-950 before:w-[13px] before:bg-red-600",
      headline: "text-red-700",
      metric: "text-red-700",
    };
  }

  if (severity === "delayed") {
    return {
      action: "border-amber-600/20 text-slate-950 before:w-[9px] before:bg-amber-600",
      headline: "text-amber-700",
      metric: "text-amber-700",
    };
  }

  if (severity === "unknown") {
    return {
      action: "border-slate-400/30 text-slate-950 before:w-[9px] before:bg-slate-400",
      headline: "text-slate-600",
      metric: "text-slate-600",
    };
  }

  return {
    action: "border-emerald-700/20 text-slate-950 before:w-[5px] before:bg-emerald-700",
    headline: "text-emerald-700",
    metric: "text-emerald-700",
  };
}

function getLineTextClass(line: TrafficLineData) {
  if (line.status === "normal") {
    return "text-emerald-700";
  }

  if (line.status === "suspended") {
    return "text-red-700";
  }

  if (line.status === "unknown") {
    return "text-slate-600";
  }

  return "text-amber-700";
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
          <p className="text-lg uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          {status === "stale" ? <StaleBadge /> : null}
          {data?.generatedAt || data?.updatedAt ? <span>{formatTime(data.generatedAt ?? data.updatedAt)}</span> : null}
        </div>
      </div>

      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {isEmpty ? <EmptyState /> : null}
      {data && status !== "error" && status !== "loading" && !isEmpty && isHighlighted ? (
        <TrafficDetail
          counts={counts}
          lines={lines}
          updatedAt={data.updatedAt}
        />
      ) : null}
      {data && status !== "error" && status !== "loading" && !isEmpty && !isHighlighted ? (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
            <strong className={`text-[34px] font-semibold leading-none ${summary.className}`}>{summary.primaryLabel}</strong>
            <span className="text-[15px] font-bold text-slate-500">{summary.secondaryLabel}</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_48px_58px] items-center gap-2 pt-1 text-[11px] font-bold tracking-[0.08em] text-slate-500">
            <span>路線</span>
            <span className="text-center">更新</span>
            <span className="text-center">状態</span>
          </div>
          <ul className="mt-1 grid min-h-0">
            {lines.map((line) => (
              <li
                key={line.id}
                className="grid min-h-[28px] grid-cols-[minmax(0,1fr)_48px_58px] items-center gap-2 border-b border-slate-200 py-0.5"
              >
                <p className="truncate text-[19px] font-medium leading-tight text-slate-950">{line.name}</p>
                <span className="text-center text-[13px] font-bold text-slate-500">{formatTime(line.updatedAt)}</span>
                <span className={`rounded-full px-2 py-0.5 text-center text-[15px] font-extrabold leading-tight ${getStatusClass(line)}`}>
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
  updatedAt,
}: {
  counts: ReturnType<typeof getCounts>;
  lines: TrafficLineData[];
  updatedAt: string;
}) {
  const affectedLines = lines.filter((line) => line.status !== "normal");
  const severity = getTrafficSeverity(counts);
  const severityClasses = getSeverityClasses(severity);
  const impactLines = affectedLines.slice(0, 3);
  const remainingNormal = counts.normal;

  return (
    <div className="widget-detail-root traffic-detail-root mt-4 grid min-h-0 flex-1 grid-rows-[11.5rem_minmax(0,1fr)] gap-3 overflow-hidden">
      <section className="widget-detail-secondary traffic-detail-summary grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(520px,0.88fr)] items-center gap-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">現在の状況</p>
          <p className={`mt-2 truncate text-[2.125rem] font-extrabold leading-tight ${severityClasses.headline}`}>{getDetailHeadline(counts)}</p>
          <p className={`mt-2 grid min-h-10 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-lg border bg-white px-3 py-2 text-[1.0625rem] font-bold leading-tight before:block before:h-full before:min-h-8 before:rounded-full before:content-[''] ${severityClasses.action}`}>
            <span className="truncate">{getActionSummary(counts)}</span>
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-4 gap-2.5">
          <TrafficMetric label="影響" value={`${counts.affected}/${counts.total}`} valueClass={counts.affected > 0 ? severityClasses.metric : "text-emerald-700"} />
          <TrafficMetric label={severity === "unknown" ? "未確認" : "見合わせ"} value={`${severity === "unknown" ? counts.unknown : counts.suspended}/${counts.total}`} valueClass={counts.suspended > 0 ? "text-red-700" : severity === "unknown" ? "text-slate-600" : "text-slate-950"} />
          <TrafficMetric label="通常" value={`${counts.normal}/${counts.total}`} valueClass="text-emerald-700" />
          <TrafficMetric label="更新" value={formatTime(updatedAt)} />
        </div>
      </section>

      <div className="grid min-h-0 grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] gap-3 overflow-hidden">
        <section className="widget-detail-primary traffic-detail-impact grid min-h-0 grid-rows-[2.5rem_minmax(0,1fr)] gap-2.5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-extrabold uppercase tracking-[0.18em] text-slate-500">重要な影響</h2>
            <p className="text-[0.95rem] font-bold text-slate-500">{severity === "suspended" ? "見合わせを最優先" : severity === "delayed" ? "遅延を優先表示" : severity === "unknown" ? "未確認を通常扱いしない" : "異常なし"}</p>
          </div>
          {affectedLines.length > 0 ? (
            <div className="grid min-h-0 grid-rows-3 gap-2.5">
              {impactLines.map((line) => (
                <TrafficImpactCard key={line.id} line={line} />
              ))}
              {impactLines.length < 3 ? (
                <section className="grid min-h-0 content-start gap-2 overflow-hidden rounded-lg bg-white px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <h3 className="truncate text-2xl font-bold leading-tight text-slate-950">他の登録路線</h3>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-700">通常</span>
                  </div>
                  <p className="truncate text-base font-semibold text-slate-600">残り{remainingNormal}路線は通常運行</p>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="grid min-h-0 place-items-center gap-4 rounded-lg bg-white p-8 text-center">
              <strong className="text-[3.375rem] leading-none text-emerald-700">OK</strong>
              <p className="text-xl font-bold text-slate-600">通勤・通学に影響する運行情報はありません。</p>
            </div>
          )}
        </section>

        <section className="widget-detail-list traffic-detail-lines grid min-h-0 grid-rows-[2.5rem_minmax(0,1fr)] gap-2.5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-extrabold uppercase tracking-[0.18em] text-slate-500">登録路線</h2>
            <p className="text-[0.95rem] font-bold text-slate-500">{counts.total}路線</p>
          </div>
          <div className="grid min-h-0 content-start overflow-hidden">
            <div className="grid min-h-[1.875rem] grid-cols-[minmax(0,1fr)_6.25rem_5.5rem_minmax(7.375rem,0.62fr)] items-center gap-2.5 border-b border-slate-200 text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] text-slate-500">
              <span>路線</span>
              <span className="text-center">状態</span>
              <span className="text-center">更新</span>
              <span className="text-right">エリア</span>
            </div>
            {lines.map((line) => (
              <div key={line.id} className="grid min-h-[2.8125rem] grid-cols-[minmax(0,1fr)_6.25rem_5.5rem_minmax(7.375rem,0.62fr)] items-center gap-2.5 border-b border-slate-200 text-base">
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-950">{line.name}</span>
                  <span className="block truncate text-[0.8125rem] font-bold text-slate-500">{line.operator ?? ""}</span>
                </span>
                <span className={`text-center font-extrabold ${getLineTextClass(line)}`}>{getStatusLabel(line)}</span>
                <span className="text-center font-semibold text-slate-500">{formatTime(line.updatedAt)}</span>
                <span className="truncate text-right font-semibold text-slate-500">{line.detail ?? "-"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function TrafficImpactCard({ line }: { line: TrafficLineData }) {
  return (
    <section className="grid min-h-0 content-start gap-2 overflow-hidden rounded-lg bg-white px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <h3 className="truncate text-2xl font-bold leading-tight text-slate-950">{line.name}</h3>
        <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${getStatusClass(line)}`}>{getDetailStatusLabel(line)}</span>
      </div>
      <p className="truncate text-base font-semibold text-slate-600">{line.detail ?? "影響区間は確認中"}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <TrafficDetailRow label="理由" value={line.reason ?? "-"} />
        <TrafficDetailRow label="復旧見込み" value={line.recoveryEstimate ?? "未定"} />
        <TrafficDetailRow label="振替輸送" value={line.alternateTransport ?? "-"} />
        <TrafficDetailRow label="確認" value={formatTime(line.updatedAt)} />
      </div>
    </section>
  );
}

function TrafficMetric({ label, value, valueClass = "text-slate-950" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="grid min-h-[4.25rem] min-w-0 content-center rounded-lg bg-slate-100 px-3 py-2">
      <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</span>
      <strong className={`mt-1 block truncate text-[1.5625rem] font-extrabold leading-none ${valueClass}`}>{value}</strong>
    </div>
  );
}

function TrafficDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="text-xs font-extrabold tracking-[0.08em] text-slate-500">{label}</span>
      <strong className="truncate text-[1.0625rem] font-bold text-slate-950">{value}</strong>
    </div>
  );
}
