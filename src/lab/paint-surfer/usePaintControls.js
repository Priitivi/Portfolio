import { useEffect, useRef } from "react";

const blockedCodes = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const gameCodes = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "ShiftLeft", "ShiftRight", "Space", "KeyJ",
]);

function isTypingTarget(target) {
  return target?.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target?.tagName);
}

export default function usePaintControls(enabled) {
  const controls = useRef(new Set());

  useEffect(() => {
    if (!enabled) {
      controls.current.clear();
      return undefined;
    }

    const keyDown = (event) => {
      if (isTypingTarget(event.target) || !gameCodes.has(event.code)) return;
      if (blockedCodes.has(event.code)) event.preventDefault();
      controls.current.add(event.code);
    };
    const keyUp = (event) => controls.current.delete(event.code);
    const clear = () => controls.current.clear();
    const clearWhenHidden = () => {
      if (document.hidden) clear();
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clearWhenHidden);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clearWhenHidden);
      clear();
    };
  }, [enabled]);

  return controls;
}
