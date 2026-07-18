import { useMemo, useState } from "react";
import { normalizeKey, shortcutParts } from "../core/shortcuts";

const rows = [
  ["Escape","1","2","3","4","5","6","7","8","9","0","Backspace"],
  ["Tab","Q","W","E","R","T","Y","U","I","O","P","F2","Delete"],
  ["Ctrl","A","S","D","F","G","H","J","K","L","/","`","Enter"],
  ["Shift","Z","X","C","V","B","N","M","Alt","ArrowLeft","ArrowDown","ArrowUp","ArrowRight"],
];

export default function VirtualKeyboard({ required, platform, pressed = [], onShortcut }) {
  const [modifiers, setModifiers] = useState({ ctrl:false, alt:false, shift:false, meta:false });
  const requiredParts = useMemo(() => new Set(shortcutParts(required, platform).map((part) => part.toLowerCase())), [required, platform]);
  const pressedSet = new Set(pressed.map((key) => normalizeKey(key).toLowerCase()));

  const activate = (label) => {
    const normalized = label.toLowerCase();
    const modifier = normalized === "ctrl" ? (platform === "mac" ? "meta" : "ctrl") : normalized === "alt" ? "alt" : normalized === "shift" ? "shift" : null;
    if (modifier) {
      setModifiers((current) => ({ ...current, [modifier]: !current[modifier] }));
      return;
    }
    onShortcut?.({ key: normalizeKey(label), ...modifiers, source:"virtual" });
    setModifiers({ ctrl:false, alt:false, shift:false, meta:false });
  };

  return (
    <div className="sl-virtual-keyboard" aria-label="On-screen training keyboard">
      <div className="sl-keyboard-label"><span>INPUT DECK</span><strong>Click modifiers, then a key</strong></div>
      {rows.map((row, rowIndex) => (
        <div className="sl-keyboard-row" key={rowIndex}>
          {row.map((key) => {
            const display = platform === "mac" && key === "Ctrl" ? "⌘" : platform === "mac" && key === "Alt" ? "⌥" : key;
            const token = display.toLowerCase();
            const activeModifier = (key === "Ctrl" && (platform === "mac" ? modifiers.meta : modifiers.ctrl)) || (key === "Alt" && modifiers.alt) || (key === "Shift" && modifiers.shift);
            const isRequired = requiredParts.has(token) || requiredParts.has(normalizeKey(key).toLowerCase());
            const isPressed = pressedSet.has(normalizeKey(key).toLowerCase());
            return <button type="button" className={`${isRequired ? "is-required" : ""} ${isPressed || activeModifier ? "is-pressed" : ""}`} key={key} onClick={() => activate(key)} aria-pressed={activeModifier}>{display.replace("Arrow", "")}</button>;
          })}
        </div>
      ))}
    </div>
  );
}
