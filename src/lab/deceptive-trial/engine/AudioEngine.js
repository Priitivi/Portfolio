const note = (context, destination, frequency, duration, type = "sine", volume = .08, delay = 0) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .03);
};

const MUSIC_PROFILES = [
  { tempo: 76, scale: [0, 2, 3, 7, 9, 10], density: 0.48, bass: 0.012, tick: 0 },
  { tempo: 84, scale: [0, 2, 3, 5, 7, 9, 10], density: 0.62, bass: 0.014, tick: 0.006 },
  { tempo: 92, scale: [0, 1, 3, 5, 7, 8, 10], density: 0.74, bass: 0.016, tick: 0.008 },
  { tempo: 102, scale: [0, 1, 3, 6, 7, 8, 10], density: 0.88, bass: 0.019, tick: 0.01 },
];

const MOTIF = [0, null, 2, 4, 1, null, 4, null, 0, 3, null, 2, 5, null, 1, null];

export const getMusicProfile = (levelIndex) => MUSIC_PROFILES[Math.min(MUSIC_PROFILES.length - 1, Math.max(0, Math.floor(levelIndex / 3)))];

const scaleFrequency = (root, scale, degree, octave = 1) => {
  const safeDegree = Math.max(0, degree);
  const scaleIndex = safeDegree % scale.length;
  const octaveOffset = Math.floor(safeDegree / scale.length);
  return root * (2 ** (octave + octaveOffset + scale[scaleIndex] / 12));
};

export default class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.master = null;
    this.music = null;
    this.effects = null;
    this.compressor = null;
    this.ambientNodes = [];
    this.mood = null;
    this.levelIndex = 0;
    this.scoreTimer = 0;
    this.scoreStep = 0;
    this.nextScoreTime = 0;
  }

  ensure() {
    if (this.context) return this.context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.music = this.context.createGain();
    this.effects = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = .006;
    this.compressor.release.value = .18;
    this.music.connect(this.master);
    this.effects.connect(this.master);
    this.master.connect(this.compressor).connect(this.context.destination);
    this.applySettings(this.settings);
    return this.context;
  }

  resume() {
    const context = this.ensure();
    if (!context) return;
    if (context.state === "suspended") context.resume().then(() => this.startScore());
    else if (context.state === "running") this.startScore();
  }

  applySettings(settings) {
    this.settings = settings;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(settings.masterVolume ?? .7, now, .03);
    this.music.gain.setTargetAtTime(settings.musicVolume ?? .45, now, .03);
    this.effects.gain.setTargetAtTime(settings.effectsVolume ?? .75, now, .03);
  }

  play(name) {
    const context = this.ensure();
    if (!context || context.state !== "running") return;
    const sounds = {
      jump: [[420, .12, "triangle", .055], [610, .08, "sine", .035, .05]],
      land: [[105, .08, "triangle", .035]],
      death: [[170, .26, "sawtooth", .065], [92, .34, "square", .032, .06]],
      checkpoint: [[330, .14, "sine", .045], [495, .18, "sine", .04, .1], [660, .28, "triangle", .032, .2]],
      secret: [[520, .17, "sine", .05], [780, .22, "sine", .045, .1], [1040, .3, "triangle", .035, .2]],
      collect: [[740, .09, "sine", .045], [980, .12, "triangle", .035, .04]],
      warning: [[72, .22, "triangle", .025], [48, .3, "sine", .018, .04]],
      ui: [[280, .07, "triangle", .035]],
      victory: [[330, .25, "triangle", .05], [440, .3, "triangle", .05, .12], [660, .45, "sine", .055, .25]],
    };
    if (name === "death") this.duckMusic(.42, .38);
    if (name === "checkpoint") this.duckMusic(.72, .24);
    if (name === "victory") this.duckMusic(.48, .62);
    (sounds[name] || sounds.ui).forEach(([frequency, duration, type, volume, delay]) => note(context, this.effects, frequency, duration, type, volume, delay));
  }

  setMood(mood = "dawn", levelIndex = 0) {
    if (this.mood === mood && this.levelIndex === levelIndex) return;
    this.mood = mood;
    this.levelIndex = levelIndex;
    const context = this.ensure();
    if (!context) return;
    this.stopScore();
    this.stopAmbient();
    const roots = { dawn: 110, gold: 123.47, blue: 98, violet: 82.41, green: 103.83, silver: 116.54, red: 77.78, night: 65.41 };
    const root = roots[mood] || 98;
    [1, 1.5, 2.01].forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = root * ratio;
      oscillator.detune.value = index * 4 - 3;
      filter.type = "lowpass";
      filter.frequency.value = 420 + index * 180;
      gain.gain.value = index === 0 ? .021 : .007;
      oscillator.connect(filter).connect(gain).connect(this.music);
      oscillator.start();
      this.ambientNodes.push(oscillator, gain, filter);
    });
    if (context.state === "running") this.startScore();
  }

  startScore() {
    if (!this.context || this.context.state !== "running" || this.scoreTimer) return;
    this.scoreStep = 0;
    this.nextScoreTime = this.context.currentTime + .08;
    this.scheduleScore();
    this.scoreTimer = window.setInterval(() => this.scheduleScore(), 90);
  }

  scheduleScore() {
    if (!this.context || this.context.state !== "running") return;
    const profile = getMusicProfile(this.levelIndex);
    const stepDuration = 60 / profile.tempo / 2;
    while (this.nextScoreTime < this.context.currentTime + .3) {
      this.scheduleScoreStep(this.nextScoreTime, this.scoreStep, profile, stepDuration);
      this.scoreStep += 1;
      this.nextScoreTime += stepDuration;
    }
  }

  scheduleScoreStep(start, step, profile, stepDuration) {
    const roots = { dawn: 110, gold: 123.47, blue: 98, violet: 82.41, green: 103.83, silver: 116.54, red: 77.78, night: 65.41 };
    const root = roots[this.mood] || 98;
    const cycle = Math.floor(step / MOTIF.length);
    const shiftedStep = (step + (cycle % 4 === 3 ? 2 : 0)) % MOTIF.length;
    const degree = MOTIF[shiftedStep];
    const shouldPlay = degree != null && ((step * 37 + cycle * 17) % 100) / 100 < profile.density;

    if (shouldPlay) {
      const variation = cycle % 4 === 2 && shiftedStep > 7 ? 1 : 0;
      const frequency = scaleFrequency(root, profile.scale, degree + variation, 1);
      this.scoreVoice(frequency, start, stepDuration * .72, .026, "triangle", 1450);
      if (step % 8 === 0) this.scoreVoice(frequency * 2.01, start + .035, stepDuration * .42, .008, "sine", 2200);
    }

    if (step % 8 === 0) {
      const bassDegree = cycle % 3 === 2 ? 4 : 0;
      this.scoreVoice(scaleFrequency(root, profile.scale, bassDegree, 0) / 2, start, stepDuration * 3.2, profile.bass, "sine", 360);
    }

    if (profile.tick && step % 4 === 2) {
      this.scoreVoice(1180 + (step % 3) * 90, start, .035, profile.tick, "square", 2600);
    }

    if (this.levelIndex >= 8 && step % 16 === 14) {
      this.scoreVoice(root * Math.SQRT2, start, stepDuration * 1.7, .006 + this.levelIndex * .0004, "sine", 740);
    }
  }

  scoreVoice(frequency, start, duration, volume, type, cutoff) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(filter).connect(gain).connect(this.music);
    oscillator.start(start);
    oscillator.stop(start + duration + .04);
  }

  duckMusic(factor, duration) {
    if (!this.context || !this.music) return;
    const now = this.context.currentTime;
    const base = this.settings.musicVolume ?? .45;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setTargetAtTime(base * factor, now, .025);
    this.music.gain.setTargetAtTime(base, now + duration, .12);
  }

  stopScore() {
    if (this.scoreTimer) window.clearInterval(this.scoreTimer);
    this.scoreTimer = 0;
  }

  stopAmbient() {
    this.ambientNodes.forEach((node) => { try { node.stop?.(); } catch { /* already stopped */ } try { node.disconnect(); } catch { /* detached */ } });
    this.ambientNodes = [];
  }

  destroy() { this.stopScore(); this.stopAmbient(); this.context?.close(); this.context = null; }
}
