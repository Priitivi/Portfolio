import assert from "node:assert/strict";
import test from "node:test";
import { buildConditionsPayload } from "../netlify/functions/basecamp-conditions.mjs";

const weather = {
  current: {
    time: "2026-08-21T09:00",
    temperature_2m: 19,
    apparent_temperature: 18,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 14,
    wind_gusts_10m: 28,
  },
  hourly: {
    time: ["2026-08-21T09:00"],
    precipitation_probability: [35],
  },
  daily: {
    time: ["2026-08-21", "2026-08-22", "2026-08-23"],
    weather_code: [2, 61, 3],
    temperature_2m_max: [22, 20, 21],
    temperature_2m_min: [14, 13, 12],
    precipitation_probability_max: [35, 70, 30],
    wind_speed_10m_max: [18, 22, 15],
    wind_gusts_10m_max: [30, 38, 24],
    sunrise: ["2026-08-21T05:58", "2026-08-22T06:00", "2026-08-23T06:01"],
    sunset: ["2026-08-21T20:18", "2026-08-22T20:16", "2026-08-23T20:14"],
  },
};

const marine = {
  current: {
    time: "2026-08-21T09:00",
    wave_height: 1.3,
    wave_period: 5.2,
    sea_level_height_msl: -0.2,
    sea_surface_temperature: 16,
    ocean_current_velocity: 1.1,
  },
  hourly: {
    time: [
      "2026-08-21T09:00",
      "2026-08-21T10:00",
      "2026-08-21T11:00",
      "2026-08-21T12:00",
      "2026-08-21T13:00",
    ],
    wave_height: [1.3, 1.2, 1.1, 1.1, 1],
    wave_period: [5.2, 5.1, 5, 4.9, 4.8],
    sea_level_height_msl: [-0.2, 0.1, 0.4, 0.2, -0.1],
  },
  daily: {
    time: ["2026-08-21", "2026-08-22", "2026-08-23"],
    wave_height_max: [1.4, 1.8, 0.9],
    wave_period_max: [5.5, 6.2, 4.8],
  },
};

test("conditions payload selects the trip window when all dates are available", () => {
  const payload = buildConditionsPayload(
    weather,
    marine,
    new Date("2026-08-21T08:15:00Z"),
  );

  assert.equal(payload.forecast.mode, "trip");
  assert.equal(payload.forecast.hasFullTripWeather, true);
  assert.equal(payload.forecast.hasFullTripMarine, true);
  assert.equal(payload.forecast.days.length, 3);
  assert.equal(payload.signal.level, "Watch");
});

test("tide trend exposes modelled turning points and normalized chart positions", () => {
  const payload = buildConditionsPayload(weather, marine);

  assert.deepEqual(payload.tide.events[0], {
    type: "Modelled high",
    time: "2026-08-21T11:00",
    level: 0.4,
  });
  assert.equal(payload.tide.series[0].position, 0);
  assert.equal(payload.tide.series[2].position, 100);
});
