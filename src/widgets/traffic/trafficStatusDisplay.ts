import type { TrafficLineData } from "./types";

export function getStatusLabel(line: TrafficLineData) {
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

export function getStatusClass(line: TrafficLineData) {
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

export function getSummary(lines: TrafficLineData[]) {
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

export function getCounts(lines: TrafficLineData[]) {
  const delayed = lines.filter((line) => line.status === "delayed" || line.status === "partiallyDelayed").length;
  const suspended = lines.filter((line) => line.status === "suspended").length;
  const unknown = lines.filter((line) => line.status === "unknown").length;
  const affected = lines.filter((line) => line.status !== "normal").length;
  const normal = lines.length - affected;
  return { affected, delayed, normal, suspended, total: lines.length, unknown };
}

export function getDetailStatusLabel(line: TrafficLineData) {
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

export function getTrafficSeverity(counts: ReturnType<typeof getCounts>) {
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

export function getDetailHeadline(counts: ReturnType<typeof getCounts>) {
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

export function getActionSummary(counts: ReturnType<typeof getCounts>) {
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

export function getSeverityClasses(severity: ReturnType<typeof getTrafficSeverity>) {
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

export function getLineTextClass(line: TrafficLineData) {
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
