import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechSynthesisController,
  supportsSpeechSynthesis,
} from "../utils/browserSpeech.js";

export default function useSpeechSynthesis() {
  const [state, setState] = useState({ speaking: false, paused: false });
  const [error, setError] = useState("");
  const controllerRef = useRef(null);
  const userActivatedRef = useRef(false);
  const supported = supportsSpeechSynthesis(globalThis.window);

  useEffect(() => {
    controllerRef.current = createSpeechSynthesisController({
      onStateChange: setState,
      onError: setError,
    });
    return () => controllerRef.current?.stop();
  }, []);

  const speak = useCallback((text, { userInitiated = false } = {}) => {
    if (userInitiated) userActivatedRef.current = true;
    if (!userActivatedRef.current) return false;
    return controllerRef.current?.speak(text) || false;
  }, []);

  const unlock = useCallback(() => {
    userActivatedRef.current = true;
  }, []);

  return {
    supported,
    speaking: state.speaking,
    paused: state.paused,
    error,
    speak,
    unlock,
    pause: () => controllerRef.current?.pause(),
    resume: () => controllerRef.current?.resume(),
    stop: () => controllerRef.current?.stop(),
  };
}
