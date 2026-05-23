import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockCalendarData } from "../services/calendar/mockData";
import { mockNewsData } from "../services/news/mockData";
import { mockStocksData } from "../services/stocks/mockData";
import { mockTrafficLines } from "../services/traffic/mockData";
import { mockWeatherData } from "../test/mocks/weather";
import type { WidgetConfig } from "../types/widget";
import { CalendarWidget } from "../widgets/calendar/CalendarWidget";
import type { CalendarSettings } from "../widgets/calendar/types";
import { NewsWidget } from "../widgets/news/NewsWidget";
import type { NewsSettings } from "../widgets/news/types";
import { PetPhotoWidget } from "../widgets/petPhoto/PetPhotoWidget";
import type { PetPhotoData, PetPhotoSettings } from "../widgets/petPhoto/types";
import { StocksWidget } from "../widgets/stocks/StocksWidget";
import type { StocksSettings } from "../widgets/stocks/types";
import { TrafficWidget } from "../widgets/traffic/TrafficWidget";
import type { TrafficData, TrafficSettings } from "../widgets/traffic/types";
import { WeatherWidget } from "../widgets/weather/WeatherWidget";
import type { WeatherSettings } from "../widgets/weather/types";

function expectProbe(container: HTMLElement, selector: string) {
  expect(container.querySelector(selector), selector).toBeInTheDocument();
}

const weatherConfig: WidgetConfig<WeatherSettings> = {
  id: "weather-main",
  type: "weather",
  title: "Weather",
  enabled: true,
  size: "large",
  refreshIntervalSec: 1800,
  order: 1,
  settings: {
    provider: "mock",
    latitude: 35.6812,
    longitude: 139.7671,
    locationName: "Tokyo",
    units: "metric",
    showTomorrow: true,
    showHumidity: true,
    showWind: true,
  },
};

const calendarConfig: WidgetConfig<CalendarSettings> = {
  id: "calendar-main",
  type: "calendar",
  title: "Calendar",
  enabled: true,
  size: "large",
  refreshIntervalSec: 600,
  order: 2,
  settings: {
    provider: "mock",
    daysAhead: 2,
    maxTodayEvents: 4,
    maxTomorrowEvents: 2,
    showAllDayEvents: true,
  },
};

const trafficConfig: WidgetConfig<TrafficSettings> = {
  id: "traffic-main",
  type: "traffic",
  title: "Traffic",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 300,
  order: 3,
  settings: {
    provider: "mock",
    lines: [],
    maxItems: 8,
    showLineUpdatedAt: true,
    allowLocalOverride: true,
  },
};

const trafficData: TrafficData = {
  lines: mockTrafficLines,
  updatedAt: "2026-05-19T07:40:00+09:00",
};

const newsConfig: WidgetConfig<NewsSettings> = {
  id: "news-main",
  type: "news",
  title: "News",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 1800,
  order: 4,
  settings: {
    provider: "mock",
    feeds: [{ id: "nhk", name: "NHK" }],
    maxItems: 5,
    showSource: true,
    showPublishedAt: true,
  },
};

const petPhotoConfig: WidgetConfig<PetPhotoSettings> = {
  id: "pet-photo-main",
  type: "petPhoto",
  title: "Pet Photo",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 43200,
  order: 5,
  settings: {
    provider: "staticManifest",
    manifestPath: "/pets/manifest.json",
    selection: "twiceDaily",
  },
};

const petPhotoData: PetPhotoData = {
  photo: { favorite: true, id: "photo-1", src: "/pets/photo-1.jpg" },
  selectedForPeriod: "2026-05-20-am",
  totalPhotos: 42,
};

const stocksConfig: WidgetConfig<StocksSettings> = {
  id: "stocks-main",
  type: "stocks",
  title: "Markets",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 600,
  order: 6,
  settings: {
    provider: "mock",
    symbols: ["^N225", "^IXIC"],
    maxItems: 5,
    showCurrency: true,
    showMarketState: true,
  },
};

describe("layout measurement probes", () => {
  it("exposes stable probes on weather detail layout", () => {
    const { container } = render(<WeatherWidget config={weatherConfig} data={mockWeatherData} isEmpty={false} isHighlighted status="success" />);

    expectProbe(container, ".widget-detail-root.weather-detail-root");
    expectProbe(container, ".widget-detail-primary.weather-detail-top");
    expectProbe(container, ".widget-detail-secondary.weather-detail-daily-stack");
    expectProbe(container, ".weather-detail-now");
    expectProbe(container, ".weather-detail-daily");
    expectProbe(container, ".weather-detail-alerts");
    expectProbe(container, ".widget-scroll-region.weather-detail-hourly");
  });

  it("exposes stable probes on all highlighted widget layouts", () => {
    const calendar = render(<CalendarWidget config={calendarConfig} data={mockCalendarData} isEmpty={false} isHighlighted status="success" />);
    expectProbe(calendar.container, ".widget-detail-root.calendar-detail-root");
    expectProbe(calendar.container, ".widget-detail-list.calendar-detail-events");

    const traffic = render(<TrafficWidget config={trafficConfig} data={trafficData} isEmpty={false} isHighlighted status="success" />);
    expectProbe(traffic.container, ".widget-detail-root.traffic-detail-root");
    expectProbe(traffic.container, ".widget-detail-primary.traffic-detail-impact");
    expectProbe(traffic.container, ".widget-detail-list.traffic-detail-lines");

    const news = render(<NewsWidget config={newsConfig} data={mockNewsData} isEmpty={false} isHighlighted status="success" />);
    expectProbe(news.container, ".widget-detail-root.news-detail-root");
    expectProbe(news.container, ".widget-detail-primary.news-detail-featured");
    expectProbe(news.container, ".widget-detail-list.news-detail-list");

    const petPhoto = render(<PetPhotoWidget config={petPhotoConfig} data={petPhotoData} isEmpty={false} isHighlighted status="success" />);
    expectProbe(petPhoto.container, ".widget-detail-root.petPhoto-detail-root");
    expectProbe(petPhoto.container, ".widget-detail-primary.petPhoto-detail-media");

    const stocks = render(<StocksWidget config={stocksConfig} data={mockStocksData} isEmpty={false} isHighlighted status="success" />);
    expectProbe(stocks.container, ".widget-detail-root.stocks-detail-root");
    expectProbe(stocks.container, ".widget-detail-list.stocks-detail-list");
  });
});
