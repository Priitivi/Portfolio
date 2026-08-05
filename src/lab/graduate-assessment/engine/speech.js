export function getSpeechRecognitionConstructor(windowObject = globalThis.window) {
  return windowObject?.SpeechRecognition || windowObject?.webkitSpeechRecognition || null;
}
export function supportsSpeechRecognition(windowObject = globalThis.window) {
  return Boolean(getSpeechRecognitionConstructor(windowObject));
}

const errorMessages = {
  "not-allowed": "Microphone access was not allowed. You can continue by typing.",
  "service-not-allowed": "Browser speech recognition is blocked. You can continue by typing.",
  "audio-capture": "No working microphone was found. You can continue by typing.",
  network: "Speech recognition lost its network service. Your transcript is safe and typing still works.",
  "no-speech": "No speech was detected. Restart the microphone when you are ready, or continue by typing.",
};

export function createSpeechRecognitionController({
  windowObject = globalThis.window,
  onFinalTranscript = () => {},
  onInterimTranscript = () => {},
  onListeningChange = () => {},
  onError = () => {},
} = {}) {
  const Recognition = getSpeechRecognitionConstructor(windowObject);
  if (!Recognition) return { supported: false, start: () => false, stop: () => {}, abort: () => {}, recognition: null };

  const recognition = new Recognition();
  let requestedStop = false;
  let listening = false;
  let errored = false;
  recognition.lang = "en-GB";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    requestedStop = false;
    listening = true;
    errored = false;
    onError("");
    onListeningChange(true);
  };
  recognition.onresult = (event) => {
    let interim = "";
    let finalTranscript = "";
    for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
      const transcript = event.results[index]?.[0]?.transcript || "";
      if (event.results[index].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }
    onInterimTranscript(interim.trim());
    if (finalTranscript.trim()) {
      onFinalTranscript(finalTranscript.trim());
      onInterimTranscript("");
    }
  };
  recognition.onerror = (event) => {
    listening = false;
    errored = true;
    onListeningChange(false);
    if (event.error === "aborted") return;
    onError(errorMessages[event.error] || "Speech recognition paused unexpectedly. Your transcript is safe and you can continue by typing.");
  };
  recognition.onend = () => {
    const unexpected = listening && !requestedStop && !errored;
    listening = false;
    onListeningChange(false);
    onInterimTranscript("");
    if (unexpected) onError("Speech recognition stopped unexpectedly. Your transcript is safe; restart the microphone or continue by typing.");
  };

  return {
    supported: true,
    recognition,
    start() {
      try {
        requestedStop = false;
        errored = false;
        onError("");
        recognition.start();
        return true;
      } catch {
        onError("Speech recognition is already active or unavailable. Stop it before trying again.");
        return false;
      }
    },
    stop() {
      requestedStop = true;
      recognition.stop();
    },
    abort() {
      requestedStop = true;
      recognition.abort();
    },
  };
}
