import { useRef, useState } from "react";

export default function AudioDropzone({ onFile, compact = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const choose = (files) => {
    const [file] = files || [];
    if (file) onFile(file);
  };

  return (
    <div
      className={`reactor-dropzone ${dragging ? "is-dragging" : ""} ${compact ? "is-compact" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files); }}
    >
      <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm" onChange={(event) => choose(event.target.files)} aria-label="Choose a local audio file" />
      <div aria-hidden="true" className="reactor-drop-icon"><i /><i /><i /></div>
      <strong>{compact ? "Replace track" : "Feed the reactor"}</strong>
      {!compact && <p>Drop a local audio file here or choose one from this device.</p>}
      <button type="button" onClick={() => inputRef.current?.click()}>{compact ? "Choose file" : "Select audio file"}</button>
      {!compact && <small>MP3 · WAV · OGG · M4A · AAC · FLAC · WebM</small>}
    </div>
  );
}
