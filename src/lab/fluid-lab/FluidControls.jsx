import { FLUID_PALETTES, FLUID_QUALITY_PRESETS } from "./fluidConfig";

const sliders = [
  { key: "brush", label: "Brush size", min: 0.022, max: 0.105, step: 0.001, format: (value) => `${Math.round(value * 1000)}` , hint: "Radius of each dye and momentum injection." },
  { key: "force", label: "Pointer force", min: 1, max: 13, step: 0.1, format: (value) => value.toFixed(1), hint: "How strongly pointer speed pushes the velocity field." },
  { key: "dye", label: "Dye load", min: 0.25, max: 1.8, step: 0.05, format: (value) => value.toFixed(2), hint: "Pigment deposited by each brush sample." },
  { key: "vorticity", label: "Vorticity", min: 0, max: 46, step: 1, format: (value) => Math.round(value), hint: "Restores tight curls that numerical advection naturally softens." },
  { key: "dissipation", label: "Dissipation", min: 0.015, max: 0.3, step: 0.005, format: (value) => value.toFixed(3), hint: "How quickly velocity and colour fade from the field." },
];

function FluidSlider({ config, value, onChange }) {
  const hintId = `fluid-${config.key}-hint`;
  return (
    <label className="fluid-slider" title={config.hint}>
      <span><strong>{config.label}</strong><output>{config.format(value)}</output></span>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(event) => onChange(config.key, Number(event.target.value))}
        aria-describedby={hintId}
      />
      <small id={hintId}>{config.hint}</small>
    </label>
  );
}

export default function FluidControls({
  collapsed,
  setCollapsed,
  settings,
  updateSetting,
  qualityMode,
  actualQuality,
  setQualityMode,
  paused,
  onTogglePause,
  onClear,
  onBurst,
  onFullscreen,
  fullscreen,
  performance,
}) {
  return (
    <aside className={`fluid-controls ${collapsed ? "is-collapsed" : ""}`} aria-label="Fluid simulation controls">
      <div className="fluid-controls-heading">
        <div><span>FIELD CONTROLS</span><strong>Shape the current</strong></div>
        <button type="button" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed}>
          {collapsed ? "Open" : "Fold"}
        </button>
      </div>

      <div className="fluid-controls-body">
        <fieldset className="fluid-palette-picker">
          <legend>Palette</legend>
          <div>
            {Object.entries(FLUID_PALETTES).map(([id, palette]) => (
              <button
                type="button"
                key={id}
                className={settings.palette === id ? "is-active" : ""}
                onClick={() => updateSetting("palette", id)}
                aria-pressed={settings.palette === id}
                title={`Use the ${palette.label} dye palette`}
              >
                <i style={{ background: `linear-gradient(135deg, ${palette.colours.join(", ")})` }} aria-hidden="true" />
                <span>{palette.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="fluid-slider-stack">
          {sliders.map((config) => <FluidSlider key={config.key} config={config} value={settings[config.key]} onChange={updateSetting} />)}
        </div>

        <label className="fluid-quality">
          <span><strong>Resolution</strong><small>Auto reacts to device capability and sustained frame rate.</small></span>
          <select value={qualityMode} onChange={(event) => setQualityMode(event.target.value)}>
            <option value="auto">Auto ({FLUID_QUALITY_PRESETS[actualQuality].label})</option>
            {Object.entries(FLUID_QUALITY_PRESETS).map(([id, preset]) => <option key={id} value={id}>{preset.label}</option>)}
          </select>
        </label>

        <div className="fluid-actions">
          <button type="button" onClick={onTogglePause}>{paused ? "Resume field" : "Pause field"}</button>
          <button type="button" onClick={onClear}>Clear dye</button>
          <button type="button" onClick={onBurst}>Random burst</button>
          <button type="button" onClick={onFullscreen}>{fullscreen ? "Exit fullscreen" : "Fullscreen"}</button>
        </div>

        <div className="fluid-telemetry" aria-label="Simulation performance">
          <span>GPU PIPELINE</span><strong>{performance.fps ? `${performance.fps} FPS` : "CALIBRATING"}</strong>
          <small>{performance.resolution || "Allocating framebuffers"}</small>
        </div>

        <p className="fluid-shortcuts"><kbd>P</kbd> pause <kbd>C</kbd> clear <kbd>B</kbd> burst <kbd>H</kbd> interface <kbd>F</kbd> fullscreen</p>
      </div>
    </aside>
  );
}
