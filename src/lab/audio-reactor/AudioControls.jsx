import AudioDropzone from "./AudioDropzone";
import { palettes, visualModes } from "./reactorConfig";
import { formatTime } from "./audio/formatTime";

function RangeControl({ label, value, min = 0, max = 1, step = 0.01, onChange }) {
  return (
    <label className="reactor-range">
      <span>{label}<output>{Math.round(value * 100)}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function ModeSelector({ mode, onChange }) {
  return (
    <div className="reactor-mode-selector" role="group" aria-label="Visual mode">
      {visualModes.map((item, index) => (
        <button key={item.id} type="button" className={mode === item.id ? "is-active" : ""} onClick={() => onChange(item.id)} aria-pressed={mode === item.id}>
          <span>0{index + 1}</span><strong>{item.label}</strong><small>{item.short}</small>
        </button>
      ))}
    </div>
  );
}

export function TransportControls({ track, onTogglePlayback, onSeek, onVolume, onRestart, onRemove }) {
  return (
    <div className="reactor-transport">
      <button type="button" className="reactor-play" onClick={onTogglePlayback} aria-label={track.playing ? "Pause audio" : "Play audio"}>{track.playing ? "Ⅱ" : "▶"}</button>
      <button type="button" onClick={onRestart} aria-label="Restart track">↺</button>
      <div className="reactor-track-time">
        <span>{formatTime(track.currentTime)}</span>
        <input aria-label="Track position" type="range" min="0" max={track.duration || 0} step="0.01" value={Math.min(track.currentTime, track.duration || 0)} onChange={(event) => onSeek(Number(event.target.value))} />
        <span>{formatTime(track.duration)}</span>
      </div>
      <label className="reactor-volume"><span aria-hidden="true">VOL</span><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={track.volume} onChange={(event) => onVolume(Number(event.target.value))} /></label>
      <button type="button" onClick={onRemove} aria-label="Remove current track">×</button>
    </div>
  );
}

export default function AudioControls({ collapsed, setCollapsed, settings, updateSetting, track, onFile, onFullscreen, onHideInterface, visualsPaused, onToggleVisuals, quality }) {
  return (
    <aside className={`reactor-control-panel ${collapsed ? "is-collapsed" : ""}`} aria-label="Reactor controls">
      <button type="button" className="reactor-panel-toggle" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>{collapsed ? "Controls +" : "Collapse −"}</button>
      {!collapsed && (
        <div className="reactor-panel-body">
          <div className="reactor-panel-heading"><span>CALIBRATION DECK</span><strong>{quality.tier.toUpperCase()} QUALITY</strong></div>
          <AudioDropzone onFile={onFile} compact />
          <label className="reactor-select"><span>Visual mode</span><select value={settings.mode} onChange={(event) => updateSetting("mode", event.target.value)}>{visualModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label>
          <label className="reactor-select"><span>Palette</span><select value={settings.palette} onChange={(event) => updateSetting("palette", event.target.value)}>{Object.entries(palettes).map(([id, palette]) => <option key={id} value={id}>{palette.label}</option>)}</select></label>
          <RangeControl label="Intensity" value={settings.intensity} onChange={(value) => updateSetting("intensity", value)} />
          <RangeControl label="Motion speed" value={settings.speed} onChange={(value) => updateSetting("speed", value)} />
          <RangeControl label="Sensitivity" value={settings.sensitivity} min={0.35} max={1.8} onChange={(value) => updateSetting("sensitivity", value)} />
          <RangeControl label="Camera motion" value={settings.cameraMotion} onChange={(value) => updateSetting("cameraMotion", value)} />
          <RangeControl label="Glow strength" value={settings.glow} onChange={(value) => updateSetting("glow", value)} />
          <RangeControl label="Audio smoothing" value={settings.smoothing} min={0.03} max={0.5} onChange={(value) => updateSetting("smoothing", value)} />
          <div className="reactor-panel-actions">
            <button type="button" onClick={onToggleVisuals}>{visualsPaused ? "Resume visuals" : "Pause visuals"}</button>
            <button type="button" onClick={onFullscreen}>Fullscreen</button>
            <button type="button" onClick={onHideInterface}>Hide interface</button>
          </div>
          {track.name && <p className="reactor-local-notice">LOCAL BUFFER // {track.name}</p>}
        </div>
      )}
    </aside>
  );
}
