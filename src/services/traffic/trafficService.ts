import type { WidgetService } from "../../types/widget";
import { mockTrafficLines } from "./mockData";
import type { TrafficData, TrafficLineData, TrafficSettings } from "../../widgets/traffic";

const statusOrder: Record<TrafficLineData["status"], number> = {
  suspended: 0,
  delayed: 1,
  partiallyDelayed: 2,
  unknown: 3,
  normal: 4,
};

function toTrafficLineData(settings: TrafficSettings) {
  const configuredLineIds = new Set(settings.lines.map((line) => line.id));
  const configuredLinesById = new Map(settings.lines.map((line) => [line.id, line]));

  return mockTrafficLines
    .filter((line) => configuredLineIds.has(line.id))
    .map((line) => {
      const configuredLine = configuredLinesById.get(line.id);
      return {
        ...line,
        name: configuredLine?.displayName ?? configuredLine?.name ?? line.name,
        operator: configuredLine?.operator ?? line.operator,
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

export function createTrafficService(): WidgetService<TrafficSettings, TrafficData> {
  return {
    async fetch(settings) {
      // Operational path: keep the widget contract stable, then replace this mock source with public/static
      // traffic-status.json or a Worker/GitHub Actions generated JSON feed. Station departures should be a separate
      // data source because their freshness and API constraints differ from route operation status.
      return {
        lines: toTrafficLineData(settings),
        updatedAt: "2026-05-19T07:40:00+09:00",
      };
    },
  };
}
