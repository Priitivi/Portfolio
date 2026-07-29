export default function SpeechPlayback({
  supported,
  speaking,
  paused,
  error,
  onReplay,
  onPause,
  onResume,
  onStop,
  label = "Replay",
}) {
  if (!supported) {
    return <p className="ic-playback-note">Speech playback is not supported in this browser.</p>;
  }

  return (
    <div className="ic-playback">
      <button type="button" onClick={onReplay} aria-label={`${label} aloud`}>{label}</button>
      {speaking && (
        paused
          ? <button type="button" onClick={onResume}>Resume</button>
          : <button type="button" onClick={onPause}>Pause</button>
      )}
      {speaking && <button type="button" onClick={onStop}>Stop</button>}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
