import useSpeechRecognition from "../hooks/useSpeechRecognition.js";

export default function SpeechInput({ value, onChange, idPrefix, handsFree = false }) {
  const speech = useSpeechRecognition({ value, onChange });

  if (!speech.supported) {
    return (
      <div className="ic-speech-input is-unsupported">
        <span>Voice input is not supported in this browser. Typing remains fully available.</span>
      </div>
    );
  }

  return (
    <div className="ic-speech-input">
      <button
        className={`ic-mic-button ${speech.listening ? "is-listening" : ""}`}
        type="button"
        onClick={speech.listening ? speech.stop : speech.start}
        aria-pressed={speech.listening}
        aria-describedby={`${idPrefix}-speech-status`}
      >
        <span aria-hidden="true">{speech.listening ? "■" : "●"}</span>
        {speech.listening ? "Stop recording" : "Start recording"}
      </button>
      <div id={`${idPrefix}-speech-status`} className="ic-speech-status" role="status" aria-live="polite">
        {speech.listening
          ? speech.interimTranscript || "Listening… speak naturally."
          : handsFree
            ? "Recording never starts or submits automatically. Review the transcript before sending."
            : "Your final transcript is added to the editable answer. It is never sent automatically."}
      </div>
      {speech.error && <p className="ic-speech-error" role="alert">{speech.error}</p>}
    </div>
  );
}
