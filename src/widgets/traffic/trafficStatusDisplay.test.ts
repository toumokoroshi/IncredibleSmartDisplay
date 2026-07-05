import { describe, expect, it } from "vitest";

import {
  getActionSummary,
  getCounts,
  getDetailHeadline,
  getDetailStatusLabel,
  getLineTextClass,
  getSeverityClasses,
  getStatusClass,
  getStatusLabel,
  getSummary,
  getTrafficSeverity,
} from "./trafficStatusDisplay";
import type { TrafficLineData } from "./types";

function line(overrides: Partial<TrafficLineData>): TrafficLineData {
  return {
    id: "line",
    name: "路線",
    status: "normal",
    updatedAt: "2026-05-19T07:40:00+09:00",
    ...overrides,
  };
}

describe("getCounts", () => {
  it("counts delayed and partiallyDelayed lines together as delayed", () => {
    const counts = getCounts([line({ id: "a", status: "delayed" }), line({ id: "b", status: "partiallyDelayed" }), line({ id: "c", status: "normal" })]);
    expect(counts).toEqual({ affected: 2, delayed: 2, normal: 1, suspended: 0, total: 3, unknown: 0 });
  });

  it("does not fold unknown lines into normal or delayed", () => {
    const counts = getCounts([line({ id: "a", status: "unknown" }), line({ id: "b", status: "normal" })]);
    expect(counts.unknown).toBe(1);
    expect(counts.delayed).toBe(0);
    expect(counts.affected).toBe(1);
    expect(counts.normal).toBe(1);
  });
});

describe("getTrafficSeverity", () => {
  it("prioritizes suspended over delayed and unknown", () => {
    const counts = getCounts([line({ id: "a", status: "suspended" }), line({ id: "b", status: "delayed" }), line({ id: "c", status: "unknown" })]);
    expect(getTrafficSeverity(counts)).toBe("suspended");
  });

  it("prioritizes delayed over unknown when nothing is suspended", () => {
    const counts = getCounts([line({ id: "a", status: "delayed" }), line({ id: "b", status: "unknown" })]);
    expect(getTrafficSeverity(counts)).toBe("delayed");
  });

  it("reports unknown only when nothing is suspended or delayed", () => {
    const counts = getCounts([line({ id: "a", status: "unknown" }), line({ id: "b", status: "normal" })]);
    expect(getTrafficSeverity(counts)).toBe("unknown");
  });

  it("reports normal when every line is normal", () => {
    const counts = getCounts([line({ id: "a", status: "normal" })]);
    expect(getTrafficSeverity(counts)).toBe("normal");
  });
});

describe("getSummary", () => {
  it("shows a delayed count label without treating unknown lines as normal", () => {
    const summary = getSummary([line({ id: "a", status: "delayed" }), line({ id: "b", status: "unknown" }), line({ id: "c", status: "normal" })]);
    expect(summary.primaryLabel).toBe("遅延 2/3");
    expect(summary.secondaryLabel).toBe("通常 1/3");
  });

  it("labels suspended-affected lines as 見合わせ even when other lines are only delayed", () => {
    const summary = getSummary([line({ id: "a", status: "suspended" }), line({ id: "b", status: "delayed" })]);
    expect(summary.primaryLabel).toBe("見合わせ 2/2");
  });

  it("labels unknown-only impact as 未確認", () => {
    const summary = getSummary([line({ id: "a", status: "unknown" })]);
    expect(summary.primaryLabel).toBe("未確認 1/1");
  });

  it("reports zero affected as 通常 with no impact label", () => {
    const summary = getSummary([line({ id: "a", status: "normal" })]);
    expect(summary.primaryLabel).toBe("通常 1/1");
    expect(summary.className).toBe("text-emerald-700");
  });
});

describe("getDetailHeadline", () => {
  it("reports the suspended line count when any line is suspended", () => {
    const counts = getCounts([line({ id: "a", status: "suspended" }), line({ id: "b", status: "suspended" }), line({ id: "c", status: "delayed" })]);
    expect(getDetailHeadline(counts)).toBe("2路線で運転見合わせ");
  });

  it("reports total affected count when only delayed", () => {
    const counts = getCounts([line({ id: "a", status: "delayed" }), line({ id: "b", status: "partiallyDelayed" })]);
    expect(getDetailHeadline(counts)).toBe("2路線に影響。見合わせなし");
  });

  it("reports unknown count distinctly from normal operation", () => {
    const counts = getCounts([line({ id: "a", status: "unknown" })]);
    expect(getDetailHeadline(counts)).toBe("1路線が未確認。前回情報を表示");
  });
});

describe("getActionSummary", () => {
  it("gives distinct guidance per severity", () => {
    expect(getActionSummary(getCounts([line({ id: "a", status: "suspended" })]))).toBe("経路変更を確認してください。");
    expect(getActionSummary(getCounts([line({ id: "a", status: "delayed" })]))).toBe("出発時刻に余裕を持ってください。");
    expect(getActionSummary(getCounts([line({ id: "a", status: "unknown" })]))).toBe("データ鮮度に注意してください。");
    expect(getActionSummary(getCounts([line({ id: "a", status: "normal" })]))).toBe("通常どおり移動できます。");
  });
});

describe("getStatusLabel / getDetailStatusLabel", () => {
  it("shows the delay minutes for a delayed line", () => {
    expect(getStatusLabel(line({ status: "delayed", delayMinutes: 12 }))).toBe("+12");
    expect(getDetailStatusLabel(line({ status: "delayed", delayMinutes: 12 }))).toBe("遅延 +12分");
  });

  it("falls back to a confirm label for unknown status", () => {
    expect(getStatusLabel(line({ status: "unknown" }))).toBe("確認");
    expect(getDetailStatusLabel(line({ status: "unknown" }))).toBe("要確認");
  });
});

describe("getStatusClass / getLineTextClass", () => {
  it("styles suspended lines distinctly from unknown lines", () => {
    expect(getStatusClass(line({ status: "suspended" }))).toContain("red");
    expect(getStatusClass(line({ status: "unknown" }))).toContain("slate");
    expect(getLineTextClass(line({ status: "suspended" }))).toContain("red");
    expect(getLineTextClass(line({ status: "unknown" }))).toContain("slate");
  });
});

describe("getSeverityClasses", () => {
  it("returns a distinct class set per severity", () => {
    expect(getSeverityClasses("suspended").headline).toContain("red");
    expect(getSeverityClasses("delayed").headline).toContain("amber");
    expect(getSeverityClasses("unknown").headline).toContain("slate");
    expect(getSeverityClasses("normal").headline).toContain("emerald");
  });
});
