import type { WidgetService } from "../../types/widget";
import { fetchStaticJson, fetchWorkerJson } from "../jsonProvider";
import { isIsoDateTimeString, optionalIsoDateTimeString, optionalString } from "../validationGuards";
import { mockTrafficLines } from "./mockData";
import type { TrafficData, TrafficLineData, TrafficSettings } from "../../widgets/traffic";

const statusOrder: Record<TrafficLineData["status"], number> = {
  suspended: 0,
  delayed: 1,
  partiallyDelayed: 2,
  unknown: 3,
  normal: 4,
};

function prepareTrafficLines(lines: TrafficLineData[], settings: TrafficSettings) {
  const configuredLines = "lines" in settings ? settings.lines : undefined;
  const configuredLineIds = configuredLines ? new Set(configuredLines.map((line) => line.id)) : undefined;
  const configuredLinesById = new Map(configuredLines?.map((line) => [line.id, line]) ?? []);

  return lines
    .filter((line) => configuredLineIds === undefined || configuredLineIds.has(line.id))
    .map((line) => {
      const configuredLine = configuredLinesById.get(line.id);
      if (!settings.allowLocalOverride || configuredLine === undefined) {
        return line;
      }

      return {
        ...line,
        name: configuredLine.displayName ?? configuredLine.name,
        operator: configuredLine.operator ?? line.operator,
      };
    })
    .sort((left, right) => {
      const statusDelta = statusOrder[left.status] - statusOrder[right.status];
      if (statusDelta !== 0) {
        return statusDelta;
      }
      const leftPriority = configuredLinesById.get(left.id)?.priority ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = configuredLinesById.get(right.id)?.priority ?? Number.MAX_SAFE_INTEGER;
      return leftPriority - rightPriority || left.name.localeCompare(right.name, "ja-JP");
    });
}

function isTrafficData(value: unknown): value is TrafficData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const payload = value as Partial<TrafficData>;
  return optionalIsoDateTimeString(payload.generatedAt) && isIsoDateTimeString(payload.updatedAt) && Array.isArray(payload.lines) && payload.lines.every(isTrafficLineData);
}

function isTrafficLineData(value: unknown): value is TrafficLineData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const line = value as Partial<Record<keyof TrafficLineData, unknown>>;
  return (
    typeof line.id === "string" &&
    typeof line.name === "string" &&
    optionalString(line.operator) &&
    isTrafficStatus(line.status) &&
    isIsoDateTimeString(line.updatedAt) &&
    (line.delayMinutes === undefined || typeof line.delayMinutes === "number") &&
    optionalString(line.statusText) &&
    optionalString(line.detail) &&
    optionalString(line.reason) &&
    optionalString(line.recoveryEstimate) &&
    optionalString(line.alternateTransport)
  );
}

function isTrafficStatus(value: unknown): value is TrafficLineData["status"] {
  return value === "normal" || value === "delayed" || value === "partiallyDelayed" || value === "suspended" || value === "unknown";
}

async function fetchStaticJsonTraffic(settings: Extract<TrafficSettings, { provider: "staticJson" }>) {
  const payload = await fetchStaticJson({
    cacheBusterIntervalSec: settings.cacheBusterIntervalSec,
    failureMessagePrefix: "Failed to fetch traffic JSON",
    invalidMessage: "Invalid traffic JSON",
    url: settings.url,
    validate: isTrafficData,
  });

  const lines = prepareTrafficLines(payload.lines, settings);

  return {
    generatedAt: payload.generatedAt,
    lines: lines.slice(0, settings.maxItems),
    updatedAt: payload.updatedAt,
  };
}

async function fetchWorkerJsonTraffic(settings: Extract<TrafficSettings, { provider: "workerJson" }>) {
  const payload = await fetchWorkerJson({
    failureMessagePrefix: "Failed to fetch traffic worker JSON",
    invalidMessage: "Invalid traffic JSON",
    url: settings.url,
    validate: isTrafficData,
  });

  const lines = prepareTrafficLines(payload.lines, settings);

  return {
    generatedAt: payload.generatedAt,
    lines: lines.slice(0, settings.maxItems),
    updatedAt: payload.updatedAt,
  };
}

export function createTrafficService(): WidgetService<TrafficSettings, TrafficData> {
  return {
    async fetch(settings) {
      if (settings.provider === "staticJson") {
        return fetchStaticJsonTraffic(settings);
      }

      if (settings.provider === "workerJson") {
        return fetchWorkerJsonTraffic(settings);
      }

      // Operational path: keep the widget contract stable, then replace this mock source with public/static
      // traffic-status.json or a Worker/GitHub Actions generated JSON feed. Station departures should be a separate
      // data source because their freshness and API constraints differ from route operation status.
      return {
        lines: prepareTrafficLines(mockTrafficLines, settings),
        updatedAt: "2026-05-19T07:40:00+09:00",
      };
    },
  };
}
