import { getStore } from "@netlify/blobs";
import { json, requireBasecampUser } from "./_shared/basecamp-api.mjs";

const STORE_NAME = "durdle-basecamp";
const CACHE_KEY = "conditions-cache-v1";
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const TRIP_DATES = ["2026-08-21", "2026-08-22", "2026-08-23"];
const LOCATION = {
  name: "Durdle Door coast",
  latitude: 50.6212,
  longitude: -2.2768,
};
const WEATHER_URL = new URL("https://api.open-meteo.com/v1/forecast");
const MARINE_URL = new URL("https://marine-api.open-meteo.com/v1/marine");

WEATHER_URL.search = new URLSearchParams({
  latitude: String(LOCATION.latitude),
  longitude: String(LOCATION.longitude),
  current: [
    "temperature_2m",
    "apparent_temperature",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
    "wind_gusts_10m",
  ].join(","),
  hourly: "precipitation_probability",
  daily: [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
    "sunrise",
    "sunset",
  ].join(","),
  timezone: "Europe/London",
  forecast_days: "16",
  wind_speed_unit: "mph",
}).toString();

MARINE_URL.search = new URLSearchParams({
  latitude: String(LOCATION.latitude),
  longitude: String(LOCATION.longitude),
  current: [
    "wave_height",
    "wave_period",
    "sea_level_height_msl",
    "sea_surface_temperature",
    "ocean_current_velocity",
  ].join(","),
  hourly: "wave_height,wave_period,sea_level_height_msl",
  daily: "wave_height_max,wave_period_max",
  timezone: "Europe/London",
  forecast_days: "8",
}).toString();

function finiteNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function weatherLabel(code) {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Mostly clear";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Mixed";
}

function dailyRecords(weather, marine) {
  const marineByDate = new Map(
    (marine?.daily?.time ?? []).map((date, index) => [
      date,
      {
        waveHeightMax: finiteNumber(marine.daily.wave_height_max?.[index]),
        wavePeriodMax: finiteNumber(marine.daily.wave_period_max?.[index]),
      },
    ]),
  );

  return (weather?.daily?.time ?? []).map((date, index) => ({
    date,
    label: weatherLabel(weather.daily.weather_code?.[index]),
    weatherCode: finiteNumber(weather.daily.weather_code?.[index]),
    temperatureMax: finiteNumber(weather.daily.temperature_2m_max?.[index]),
    temperatureMin: finiteNumber(weather.daily.temperature_2m_min?.[index]),
    precipitationProbability: finiteNumber(
      weather.daily.precipitation_probability_max?.[index],
    ),
    windSpeedMax: finiteNumber(weather.daily.wind_speed_10m_max?.[index]),
    windGustMax: finiteNumber(weather.daily.wind_gusts_10m_max?.[index]),
    sunrise: weather.daily.sunrise?.[index] ?? null,
    sunset: weather.daily.sunset?.[index] ?? null,
    waveHeightMax: marineByDate.get(date)?.waveHeightMax ?? null,
    wavePeriodMax: marineByDate.get(date)?.wavePeriodMax ?? null,
  }));
}

function getCurrentPrecipitationProbability(weather) {
  const currentHour = weather?.current?.time?.slice(0, 13);
  const index = (weather?.hourly?.time ?? []).findIndex(
    (time) => time.slice(0, 13) === currentHour,
  );
  return finiteNumber(weather?.hourly?.precipitation_probability?.[index]);
}

function tideTrend(marine) {
  const times = marine?.hourly?.time ?? [];
  const levels = marine?.hourly?.sea_level_height_msl ?? [];
  const currentTime = marine?.current?.time ?? "";
  const firstFutureIndex = Math.max(
    0,
    times.findIndex((time) => time >= currentTime.slice(0, 13)),
  );
  const rawSeries = times
    .slice(firstFutureIndex, firstFutureIndex + 37)
    .map((time, index) => ({
      time,
      level: finiteNumber(levels[firstFutureIndex + index]),
    }))
    .filter((point) => point.level !== null);
  const values = rawSeries.map((point) => point.level);
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 0;
  const spread = Math.max(0.01, maximum - minimum);
  const series = rawSeries.map((point) => ({
    ...point,
    position: Math.round(((point.level - minimum) / spread) * 100),
  }));
  const events = [];

  for (let index = 1; index < series.length - 1; index += 1) {
    const previous = series[index - 1];
    const current = series[index];
    const next = series[index + 1];
    const isHigh = current.level >= previous.level && current.level > next.level;
    const isLow = current.level <= previous.level && current.level < next.level;
    if (isHigh || isLow) {
      events.push({
        type: isHigh ? "Modelled high" : "Modelled low",
        time: current.time,
        level: current.level,
      });
    }
  }

  return {
    datum: "metres above global mean sea level",
    minimum,
    maximum,
    series,
    events: events.slice(0, 6),
  };
}

function safetySignal(current, precipitationProbability) {
  const gust = current.windGust;
  const wave = current.waveHeight;
  const rain = precipitationProbability;

  if ((gust ?? 0) >= 35 || (wave ?? 0) >= 1.8 || (rain ?? 0) >= 75) {
    return {
      level: "Elevated",
      tone: "high",
      summary: "Conditions need a fresh operator and Met Office check before plans are confirmed.",
    };
  }
  if ((gust ?? 0) >= 25 || (wave ?? 0) >= 1.2 || (rain ?? 0) >= 50) {
    return {
      level: "Watch",
      tone: "watch",
      summary: "Keep plans flexible and ask the charter operator about the latest sea state.",
    };
  }
  return {
    level: "Monitor",
    tone: "calm",
    summary: "No strong model signal right now; continue normal coastal checks before travelling.",
  };
}

export function buildConditionsPayload(weather, marine, fetchedAt = new Date()) {
  const precipitationProbability = getCurrentPrecipitationProbability(weather);
  const current = {
    time: weather?.current?.time ?? marine?.current?.time ?? null,
    weather: weatherLabel(weather?.current?.weather_code),
    temperature: finiteNumber(weather?.current?.temperature_2m),
    apparentTemperature: finiteNumber(weather?.current?.apparent_temperature),
    precipitation: finiteNumber(weather?.current?.precipitation),
    precipitationProbability,
    windSpeed: finiteNumber(weather?.current?.wind_speed_10m),
    windGust: finiteNumber(weather?.current?.wind_gusts_10m),
    waveHeight: finiteNumber(marine?.current?.wave_height),
    wavePeriod: finiteNumber(marine?.current?.wave_period),
    seaLevelHeight: finiteNumber(marine?.current?.sea_level_height_msl),
    seaTemperature: finiteNumber(marine?.current?.sea_surface_temperature),
    currentVelocity: finiteNumber(marine?.current?.ocean_current_velocity),
  };
  const allDays = dailyRecords(weather, marine);
  const tripDays = TRIP_DATES
    .map((date) => allDays.find((day) => day.date === date))
    .filter(Boolean);
  const hasFullTripWeather = tripDays.length === TRIP_DATES.length
    && tripDays.every((day) => day.temperatureMax !== null);
  const hasFullTripMarine = hasFullTripWeather
    && tripDays.every((day) => day.waveHeightMax !== null);

  return {
    location: LOCATION,
    fetchedAt: fetchedAt.toISOString(),
    current,
    signal: safetySignal(current, precipitationProbability),
    forecast: {
      mode: hasFullTripWeather ? "trip" : "preview",
      label: hasFullTripWeather ? "21–23 August outlook" : "Next four days · planning preview",
      days: hasFullTripWeather ? tripDays : allDays.slice(0, 4),
      hasFullTripWeather,
      hasFullTripMarine,
      weatherWindowOpens: "2026-08-08",
      marineWindowOpens: "2026-08-16",
    },
    tide: tideTrend(marine),
    sources: {
      openMeteoWeather: "https://open-meteo.com/en/docs",
      openMeteoMarine: "https://open-meteo.com/en/docs/marine-weather-api",
      metOffice: "https://weather.metoffice.gov.uk/forecast/gbyrupkxw",
      rnliTides: "https://rnli.org/water-safety/know-the-risks/tides",
      admiraltyTides: "https://www.admiralty.co.uk/access-data/apis",
      lulworthRanges: "https://www.gov.uk/government/publications/lulworth-access-times/lulworth-range-walks-and-tyneham-village-access-times-2026",
    },
    notices: [
      "This is a planning signal, not a go/no-go decision for boating, swimming, or coastal navigation.",
      "Modelled tide height uses global mean sea level, not chart datum, and coastal accuracy is limited.",
      "The Lulworth range walks are in the published summer stand-down from 25 July to 31 August 2026; obey signs and red flags on the day.",
    ],
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Durdle-Basecamp/1.0" },
  });
  if (!response.ok) throw new Error(`Upstream conditions request failed: ${response.status}`);
  return response.json();
}

export default async function handler(request) {
  const { error } = await requireBasecampUser();
  if (error) return error;

  if (request.method !== "GET") {
    return json({ code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET" });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const cached = await store.get(CACHE_KEY, { type: "json" });
  const cachedAt = cached?.fetchedAt ? Date.parse(cached.fetchedAt) : 0;
  if (cached?.payload && Date.now() - cachedAt < CACHE_MAX_AGE_MS) {
    return json({ ...cached.payload, cache: "fresh" }, 200, {
      "Cache-Control": "private, max-age=300",
    });
  }

  try {
    const [weather, marine] = await Promise.all([
      fetchJson(WEATHER_URL),
      fetchJson(MARINE_URL),
    ]);
    const fetchedAt = new Date();
    const payload = buildConditionsPayload(weather, marine, fetchedAt);
    await store.setJSON(CACHE_KEY, { fetchedAt: fetchedAt.toISOString(), payload });
    return json({ ...payload, cache: "refreshed" }, 200, {
      "Cache-Control": "private, max-age=300",
    });
  } catch {
    if (cached?.payload) {
      return json({ ...cached.payload, cache: "stale", stale: true }, 200);
    }
    return json({ code: "CONDITIONS_UNAVAILABLE" }, 502);
  }
}
