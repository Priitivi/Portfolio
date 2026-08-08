import { useState } from "react";
import ScaleToMillionUsers from "./ScaleToMillionUsers";
import ScaleLlmApi from "./ai/ScaleLlmApi";

const tracks = [
  { id: "scaling", eyebrow: "SCALING SYSTEMS", title: "Scale to a Million Users", detail: "7 stages / compute, data, delivery, queues, failure", target: "scale-title" },
  { id: "ai", eyebrow: "AI SYSTEMS", title: "Scale an LLM API", detail: "11 stages / tokens, GPUs, memory, cost, routing", target: "ai-scale-title" },
];

export default function LearningTracks() {
  const [activeTrack, setActiveTrack] = useState(() => window.location.hash === "#ai-systems" ? "ai" : "scaling");
  const selectTrack = (track) => {
    setActiveTrack(track.id);
    window.requestAnimationFrame(() => document.getElementById(track.target)?.focus());
  };

  return (
    <>
      <section className="sd-learning-hub" id="learn" aria-labelledby="learning-tracks-title">
        <div><p className="sd-overline">LEARN / GUIDED SYSTEMS ENGINEERING</p><h2 id="learning-tracks-title">Choose the constraint<br />you want to engineer.</h2></div>
        <div className="sd-learning-track-switcher" aria-label="Guided learning tracks">
          {tracks.map((track) => <button type="button" aria-pressed={activeTrack === track.id} className={activeTrack === track.id ? "is-active" : ""} onClick={() => selectTrack(track)} key={track.id}><span>{track.eyebrow}</span><strong>{track.title}</strong><small>{track.detail}</small><i>{activeTrack === track.id ? "OPEN" : "ENTER →"}</i></button>)}
        </div>
        <p className="sd-learning-track-status" role="status">ACTIVE TRACK / {tracks.find((track) => track.id === activeTrack).title.toUpperCase()}</p>
      </section>
      {activeTrack === "scaling" ? <ScaleToMillionUsers /> : <ScaleLlmApi />}
    </>
  );
}
