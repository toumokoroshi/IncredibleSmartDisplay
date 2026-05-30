import { describe, expect, it } from "vitest";

import { buildTrafficData } from "./generate-traffic-json.mjs";

describe("generate-traffic-json", () => {
  it("normalizes manual source data into TrafficData", () => {
    const data = buildTrafficData(
      {
        updatedAt: "2026-05-30T12:00:00+09:00",
        lines: [
          {
            id: "jr-yamanote",
            name: "山手線",
            operator: "JR東日本",
            status: "normal",
            updatedAt: "2026-05-30T12:00:00+09:00",
          },
          {
            delayMinutes: 10,
            detail: "一部列車に遅れ",
            id: "jr-chuo-rapid",
            name: "中央線快速",
            operator: "JR東日本",
            reason: "混雑",
            status: "delayed",
            updatedAt: "2026-05-30T12:01:00+09:00",
          },
        ],
      },
      new Date("2026-05-30T03:05:00Z"),
    );

    expect(data).toEqual({
      generatedAt: "2026-05-30T03:05:00.000Z",
      updatedAt: "2026-05-30T12:00:00+09:00",
      lines: [
        {
          id: "jr-yamanote",
          name: "山手線",
          operator: "JR東日本",
          status: "normal",
          updatedAt: "2026-05-30T12:00:00+09:00",
        },
        {
          delayMinutes: 10,
          detail: "一部列車に遅れ",
          id: "jr-chuo-rapid",
          name: "中央線快速",
          operator: "JR東日本",
          reason: "混雑",
          status: "delayed",
          updatedAt: "2026-05-30T12:01:00+09:00",
        },
      ],
    });
  });

  it("rejects malformed manual source data before writing generated JSON", () => {
    expect(() =>
      buildTrafficData(
        {
          updatedAt: "2026-05-30T12:00:00+09:00",
          lines: [{ id: "jr-yamanote", name: "山手線", status: "broken", updatedAt: "2026-05-30T12:00:00+09:00" }],
        },
        new Date("2026-05-30T03:05:00Z"),
      ),
    ).toThrow("Invalid traffic source line: status broken");
  });
});
