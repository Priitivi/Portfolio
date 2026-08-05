import { useCallback, useEffect, useRef, useState } from "react";
import { createSpeechRecognitionController, supportsSpeechRecognition } from "../engine/speech.js";

export default function useSpeechInput({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const supported = supportsSpeechRecognition();

  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    controllerRef.current = createSpeechRecognitionController({
      onFinalTranscript: (addition) => {
        const current = String(valueRef.current || "").trimEnd();
        const next = current ? `${current} ${addition}` : addition;
        valueRef.current = next;
        onChangeRef.current(next);
      },
      onInterimTranscript: setInterim,
      onListeningChange: setListening,
      onError: setError,
    });
    return () => controllerRef.current?.abort();
  }, []);

  const start = useCallback(() => controllerRef.current?.start() || false, []);
  const stop = useCallback(() => controllerRef.current?.stop(), []);

  return { supported, listening, interim, error, start, stop };
}
