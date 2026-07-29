export const SPEECH_LANGUAGE = "en-GB";

const recognitionErrorMessages = {
  "not-allowed": "Microphone permission was denied. You can continue by typing your answer.",
  "service-not-allowed": "Speech recognition is blocked in this browser. You can continue by typing.",
  "audio-capture": "No working microphone was found. Check your device or continue by typing.",
  network: "Browser speech recognition is temporarily unavailable. You can continue by typing.",
  "no-speech": "No speech was detected. Try again when you are ready.",
};

export function getSpeechRecognitionConstructor(windowObject = globalThis.window) {
  return windowObject?.SpeechRecognition || windowObject?.webkitSpeechRecognition || null;
}

export function supportsSpeechRecognition(windowObject = globalThis.window) {
  return Boolean(getSpeechRecognitionConstructor(windowObject));
}

export function supportsSpeechSynthesis(windowObject = globalThis.window) {
  return Boolean(windowObject?.speechSynthesis && windowObject?.SpeechSynthesisUtterance);
}

export function appendTranscript(currentValue, transcript) {
  const current = String(currentValue || "").trimEnd();
  const addition = String(transcript || "").trim();
  if (!addition) return currentValue || "";
  return current ? `${current} ${addition}` : addition;
}

export function createSpeechRecognitionController({
  windowObject = globalThis.window,
  onFinalTranscript = () => {},
  onInterimTranscript = () => {},
  onListeningChange = () => {},
  onError = () => {},
} = {}) {
  const Recognition = getSpeechRecognitionConstructor(windowObject);
  if (!Recognition) {
    return {
      supported: false,
      start: () => false,
      stop: () => {},
      abort: () => {},
      recognition: null,
    };
  }

  const recognition = new Recognition();
  recognition.lang = SPEECH_LANGUAGE;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
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
    onListeningChange(false);
    if (event.error === "aborted") return;
    onError(
      recognitionErrorMessages[event.error]
      || "Speech recognition could not start. You can continue by typing.",
    );
  };

  recognition.onend = () => {
    onListeningChange(false);
    onInterimTranscript("");
  };

  return {
    supported: true,
    recognition,
    start() {
      try {
        onError("");
        recognition.start();
        return true;
      } catch {
        onListeningChange(false);
        onError("Speech recognition is already active or unavailable. Try again in a moment.");
        return false;
      }
    },
    stop() {
      recognition.stop();
    },
    abort() {
      recognition.abort();
    },
  };
}

export function createSpeechSynthesisController({
  windowObject = globalThis.window,
  onStateChange = () => {},
  onError = () => {},
} = {}) {
  const supported = supportsSpeechSynthesis(windowObject);
  if (!supported) {
    return {
      supported: false,
      speak: () => false,
      pause: () => {},
      resume: () => {},
      stop: () => {},
    };
  }

  const synthesis = windowObject.speechSynthesis;
  const update = (state) => onStateChange({ speaking: false, paused: false, ...state });

  return {
    supported: true,
    speak(text) {
      const content = String(text || "").trim();
      if (!content) return false;
      synthesis.cancel();
      const utterance = new windowObject.SpeechSynthesisUtterance(content);
      utterance.lang = SPEECH_LANGUAGE;
      utterance.rate = 0.96;
      utterance.pitch = 1;
      utterance.onstart = () => update({ speaking: true });
      utterance.onend = () => update({});
      utterance.onerror = (event) => {
        update({});
        if (event.error !== "canceled" && event.error !== "interrupted") {
          onError("Speech playback was interrupted. You can use Replay to try again.");
        }
      };
      onError("");
      synthesis.speak(utterance);
      update({ speaking: true });
      return true;
    },
    pause() {
      if (!synthesis.speaking || synthesis.paused) return;
      synthesis.pause();
      update({ speaking: true, paused: true });
    },
    resume() {
      if (!synthesis.paused) return;
      synthesis.resume();
      update({ speaking: true, paused: false });
    },
    stop() {
      synthesis.cancel();
      update({});
    },
  };
}
