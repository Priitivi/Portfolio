import assert from "node:assert/strict";
import test from "node:test";
import BeatDetector from "../src/lab/audio-reactor/audio/BeatDetector.js";
import { isSupportedAudioFile } from "../src/lab/audio-reactor/audio/AudioEngine.js";
import {
  calculateAmplitude,
  calculateFrequencyBands,
  calculateSpectralCentroid,
  calculateStereoBalance,
} from "../src/lab/audio-reactor/audio/frequencyBands.js";
import { formatTime } from "../src/lab/audio-reactor/audio/formatTime.js";

test("accepts common local audio formats without trusting filename casing", () => {
  assert.equal(isSupportedAudioFile({ name: "signal.MP3", type: "" }), true);
  assert.equal(isSupportedAudioFile({ name: "signal.bin", type: "audio/wav" }), true);
  assert.equal(isSupportedAudioFile({ name: "payload.exe", type: "application/octet-stream" }), false);
  assert.equal(isSupportedAudioFile(null), false);
});

test("calculates bounded waveform and frequency measurements", () => {
  const quiet = new Uint8Array(32).fill(128);
  const loud = new Uint8Array(32).fill(255);
  const spectrum = new Uint8Array(1024);
  spectrum[8] = 255;
  spectrum[400] = 128;

  assert.equal(calculateAmplitude(quiet), 0);
  assert.ok(calculateAmplitude(loud) > 0.9);
  const bands = calculateFrequencyBands(spectrum, 48000, 2048);
  Object.values(bands).forEach((value) => assert.ok(value >= 0 && value <= 1));
  assert.ok(calculateSpectralCentroid(spectrum, 48000, 2048) > 0);
  assert.ok(calculateSpectralCentroid(spectrum, 48000, 2048) <= 1);
});

test("reports stereo balance and rate-limits beat events", () => {
  assert.equal(calculateStereoBalance(new Uint8Array(8), new Uint8Array(8)), 0);
  assert.ok(calculateStereoBalance(new Uint8Array(8).fill(20), new Uint8Array(8).fill(200)) > 0.7);

  const detector = new BeatDetector({ threshold: 1.2, cooldown: 200 });
  for (let index = 0; index < 14; index += 1) detector.update(0.1, index * 20);
  assert.equal(detector.update(0.5, 500), true);
  assert.equal(detector.update(0.6, 550), false);
  assert.equal(detector.update(0.6, 750), true);
});

test("formats transport time consistently", () => {
  assert.equal(formatTime(Number.NaN), "0:00");
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(65.9), "1:05");
});
