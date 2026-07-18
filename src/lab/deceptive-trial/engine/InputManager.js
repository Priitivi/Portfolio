import { CONTROL_KEYS, DEFAULT_BINDINGS } from "./constants.js";

const editableTarget = (target) => target?.matches?.("input, textarea, select, [contenteditable='true']");

export default class InputManager {
  constructor(bindings = DEFAULT_BINDINGS) {
    this.bindings = bindings;
    this.down = new Set();
    this.pressed = new Set();
    this.touch = new Set();
    this.enabled = true;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  setBindings(bindings) { this.bindings = { ...DEFAULT_BINDINGS, ...bindings }; }

  actionForCode(code) {
    return CONTROL_KEYS.find((action) => this.bindings[action]?.includes(code));
  }

  onKeyDown(event) {
    if (!this.enabled || editableTarget(event.target)) return;
    const action = this.actionForCode(event.code);
    if (!action) return;
    if (!this.down.has(action)) this.pressed.add(action);
    this.down.add(action);
    event.preventDefault();
  }

  onKeyUp(event) {
    const action = this.actionForCode(event.code);
    if (!action) return;
    this.down.delete(action);
    event.preventDefault();
  }

  setTouch(action, active) {
    if (active) {
      if (!this.touch.has(action)) this.pressed.add(action);
      this.touch.add(action);
      this.down.add(action);
    } else {
      this.touch.delete(action);
      this.down.delete(action);
    }
  }

  isDown(action) { return this.down.has(action); }
  wasPressed(action) { return this.pressed.has(action); }
  consumePressed(action) { const pressed = this.pressed.has(action); this.pressed.delete(action); return pressed; }
  endFrame() { this.pressed.clear(); }
  clear() { this.down.clear(); this.pressed.clear(); this.touch.clear(); }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.clear();
  }
}
