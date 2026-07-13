import BeatDetector from "./BeatDetector.js";
import {
  calculateAmplitude,
  calculateFrequencyBands,
  calculateSpectralCentroid,
  calculateStereoBalance,
} from "./frequencyBands.js";

const supportedExtensions = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"];
const smoothKeys = ["amplitude", "subBass", "bass", "lowMid", "mid", "highMid", "treble", "spectralCentroid", "stereoBalance"];

export function isSupportedAudioFile(file) {
  if (!file) return false;
  if (file.type?.startsWith("audio/")) return true;
  const extension = file.name?.split(".").pop()?.toLowerCase();
  return supportedExtensions.includes(extension);
}

export default class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "metadata";
    this.audio.crossOrigin = "anonymous";
    this.context = null;
    this.source = null;
    this.splitter = null;
    this.analyser = null;
    this.leftAnalyser = null;
    this.rightAnalyser = null;
    this.frequencyData = null;
    this.timeData = null;
    this.leftData = null;
    this.rightData = null;
    this.objectUrl = null;
    this.trackName = "";
    this.listeners = new Set();
    this.beatDetector = new BeatDetector();
    this.smoothingFactor = 0.16;
    this.smoothed = Object.fromEntries(smoothKeys.map((key) => [key, 0]));
    this.analysis = { ...this.smoothed, beat: false, waveform: null };
    this.onMediaEvent = () => this.emit();
    ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended", "volumechange", "error"]
      .forEach((event) => this.audio.addEventListener(event, this.onMediaEvent));
  }

  async initialise() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is not supported by this browser.");
      this.context = new AudioContextClass();
      this.source = this.context.createMediaElementSource(this.audio);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.72;

      this.splitter = this.context.createChannelSplitter(2);
      this.leftAnalyser = this.context.createAnalyser();
      this.rightAnalyser = this.context.createAnalyser();
      this.leftAnalyser.fftSize = 512;
      this.rightAnalyser.fftSize = 512;

      this.source.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      this.source.connect(this.splitter);
      this.splitter.connect(this.leftAnalyser, 0);
      this.splitter.connect(this.rightAnalyser, 1);

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
      this.leftData = new Uint8Array(this.leftAnalyser.frequencyBinCount);
      this.rightData = new Uint8Array(this.rightAnalyser.frequencyBinCount);
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  async load(file) {
    if (!isSupportedAudioFile(file)) throw new Error("Choose a supported MP3, WAV, OGG, M4A, AAC, FLAC, or WebM audio file.");
    this.remove();
    this.objectUrl = URL.createObjectURL(file);
    this.trackName = file.name;
    this.audio.src = this.objectUrl;
    this.audio.load();
    this.emit();
  }

  async play() {
    if (!this.audio.src) return;
    await this.initialise();
    await this.audio.play();
  }

  pause() { this.audio.pause(); }

  restart() {
    this.audio.currentTime = 0;
    this.emit();
  }

  seek(time) {
    if (!Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
    this.emit();
  }

  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(volume, 1));
  }

  setSmoothing(value) {
    this.smoothingFactor = Math.max(0.03, Math.min(value, 0.5));
    if (this.analyser) this.analyser.smoothingTimeConstant = Math.max(0, Math.min(0.95, 1 - value));
  }

  getState() {
    return {
      name: this.trackName,
      currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0,
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      volume: this.audio.volume,
      playing: !this.audio.paused && !this.audio.ended,
      error: this.audio.error?.message || null,
    };
  }

  getAnalysis(now = performance.now()) {
    if (!this.analyser || !this.context || this.context.state !== "running") return this.analysis;
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);
    this.leftAnalyser.getByteFrequencyData(this.leftData);
    this.rightAnalyser.getByteFrequencyData(this.rightData);

    const raw = {
      amplitude: calculateAmplitude(this.timeData),
      ...calculateFrequencyBands(this.frequencyData, this.context.sampleRate, this.analyser.fftSize),
      spectralCentroid: calculateSpectralCentroid(this.frequencyData, this.context.sampleRate, this.analyser.fftSize),
      stereoBalance: calculateStereoBalance(this.leftData, this.rightData),
    };

    smoothKeys.forEach((key) => {
      this.smoothed[key] += (raw[key] - this.smoothed[key]) * this.smoothingFactor;
      this.analysis[key] = this.smoothed[key];
    });
    this.analysis.beat = this.beatDetector.update(raw.subBass * 0.65 + raw.bass * 0.35, now);
    this.analysis.waveform = this.timeData;
    return this.analysis;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  emit() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  remove() {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.trackName = "";
    this.beatDetector.reset();
    smoothKeys.forEach((key) => { this.smoothed[key] = 0; this.analysis[key] = 0; });
    this.emit();
  }

  async suspend() {
    if (this.context?.state === "running") await this.context.suspend();
  }

  async resume() {
    if (this.context?.state === "suspended") await this.context.resume();
  }

  async dispose() {
    this.remove();
    this.source?.disconnect();
    this.splitter?.disconnect();
    this.analyser?.disconnect();
    this.leftAnalyser?.disconnect();
    this.rightAnalyser?.disconnect();
    if (this.context && this.context.state !== "closed") await this.context.close();
    ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended", "volumechange", "error"]
      .forEach((event) => this.audio.removeEventListener(event, this.onMediaEvent));
    this.listeners.clear();
  }
}
