import type { WidgetService } from "../../types/widget";
import type { WeatherData, WeatherSettings } from "../../widgets/weather";
import { mockWeatherData } from "./mockData";
import { fetchOpenMeteoWeather, mapWeatherCodeToDisplayCondition } from "./openMeteoAdapter";

export { mapWeatherCodeToDisplayCondition };

export function createWeatherService(): WidgetService<WeatherSettings, WeatherData> {
  return {
    async fetch(settings) {
      if (settings.provider === "mock") {
        return mockWeatherData;
      }

      return fetchOpenMeteoWeather(settings);
    },
  };
}
