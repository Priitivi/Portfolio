import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendTranscript,
  createSpeechRecognitionController,
  supportsSpeechRecognition,
} from "../utils/browserSpeech.js";

export default function useSpeechRecognition({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const supported = supportsSpeechRecognition(globalThis.window);

  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    controllerRef.current = createSpeechRecognitionController({
      onFinalTranscript: (transcript) => {
        const nextValue = appendTranscript(valueRef.current, transcript);
        valueRef.current = nextValue;
        onChangeRef.current(nextValue);
      },
      onInterimTranscript: setInterimTranscript,
      onListeningChange: setListening,
      onError: setError,
    });

    return () => controllerRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    setInterimTranscript("");
    return controllerRef.current?.start() || false;
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    error,
    start,
    stop,
    clearError: () => setError(""),
  };
}
