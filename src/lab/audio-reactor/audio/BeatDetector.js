export default class BeatDetector {
  constructor({ historySize = 42, threshold = 1.38, cooldown = 210 } = {}) {
    this.historySize = historySize;
    this.threshold = threshold;
    this.cooldown = cooldown;
    this.history = [];
    this.lastBeatAt = 0;
  }

  update(energy, now) {
    const average = this.history.length
      ? this.history.reduce((total, value) => total + value, 0) / this.history.length
      : energy;
    const beat = this.history.length > 12
      && energy > Math.max(0.08, average * this.threshold)
      && now - this.lastBeatAt > this.cooldown;

    this.history.push(energy);
    if (this.history.length > this.historySize) this.history.shift();
    if (beat) this.lastBeatAt = now;
    return beat;
  }

  reset() {
    this.history.length = 0;
    this.lastBeatAt = 0;
  }
}
