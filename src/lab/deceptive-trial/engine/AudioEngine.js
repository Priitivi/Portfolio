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

export default class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.master = null;
    this.music = null;
    this.effects = null;
    this.ambientNodes = [];
    this.mood = null;
  }

  ensure() {
    if (this.context) return this.context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.music = this.context.createGain();
    this.effects = this.context.createGain();
    this.music.connect(this.master);
    this.effects.connect(this.master);
    this.master.connect(this.context.destination);
    this.applySettings(this.settings);
    return this.context;
  }

  resume() { const context = this.ensure(); if (context?.state === "suspended") context.resume(); }

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
      land: [[105, .09, "triangle", .05]],
      death: [[170, .28, "sawtooth", .08], [92, .38, "square", .04, .06]],
      checkpoint: [[330, .16, "sine", .055], [495, .2, "sine", .05, .1], [660, .3, "triangle", .04, .2]],
      secret: [[520, .17, "sine", .05], [780, .22, "sine", .045, .1], [1040, .3, "triangle", .035, .2]],
      collect: [[740, .09, "sine", .045], [980, .12, "triangle", .035, .04]],
      ui: [[280, .07, "triangle", .035]],
      victory: [[330, .25, "triangle", .05], [440, .3, "triangle", .05, .12], [660, .45, "sine", .055, .25]],
    };
    (sounds[name] || sounds.ui).forEach(([frequency, duration, type, volume, delay]) => note(context, this.effects, frequency, duration, type, volume, delay));
  }

  setMood(mood = "dawn") {
    if (this.mood === mood) return;
    this.mood = mood;
    const context = this.ensure();
    if (!context) return;
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
      gain.gain.value = index === 0 ? .032 : .012;
      oscillator.connect(filter).connect(gain).connect(this.music);
      oscillator.start();
      this.ambientNodes.push(oscillator, gain, filter);
    });
  }

  stopAmbient() {
    this.ambientNodes.forEach((node) => { try { node.stop?.(); } catch { /* already stopped */ } try { node.disconnect(); } catch { /* detached */ } });
    this.ambientNodes = [];
  }

  destroy() { this.stopAmbient(); this.context?.close(); this.context = null; }
}
