import { useEffect, useRef } from "react";

const blockedCodes = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export default function usePaintControls(enabled) {
  const controls = useRef(new Set());

  useEffect(() => {
    if (!enabled) {
      controls.current.clear();
      return undefined;
    }

    const keyDown = (event) => {
      const tag = event.target?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) return;
      if (blockedCodes.has(event.code)) event.preventDefault();
      controls.current.add(event.code);
    };
    const keyUp = (event) => controls.current.delete(event.code);
    const clear = () => controls.current.clear();
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear);
      clear();
    };
  }, [enabled]);

  return controls;
}
