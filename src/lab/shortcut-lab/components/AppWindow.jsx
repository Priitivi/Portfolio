import { useEffect, useState } from "react";
import AppIcon from "./AppIcon";

export default function AppWindow({ item, active, onFocus, onClose, onMinimize, onMove, children }) {
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (!drag) return undefined;
    const move = (event) => {
      const nextX = Math.max(8, Math.min(globalThis.innerWidth - 240, drag.x + event.clientX - drag.pointerX));
      const nextY = Math.max(44, Math.min(globalThis.innerHeight - 120, drag.y + event.clientY - drag.pointerY));
      onMove(item.id, { x: nextX, y: nextY });
    };
    const stop = () => setDrag(null);
    globalThis.addEventListener("pointermove", move);
    globalThis.addEventListener("pointerup", stop, { once: true });
    return () => {
      globalThis.removeEventListener("pointermove", move);
      globalThis.removeEventListener("pointerup", stop);
    };
  }, [drag, item.id, onMove]);

  if (item.minimized || !item.open) return null;

  return (
    <section
      className={`sl-window ${active ? "is-active" : ""}`}
      style={{ transform: `translate3d(${item.x}px, ${item.y}px, 0)`, zIndex: item.z, width: item.width, height: item.height }}
      onPointerDown={() => onFocus(item.id)}
      aria-label={`${item.title} simulated application`}
    >
      <header
        className="sl-window-bar"
        onPointerDown={(event) => {
          if (event.button !== 0 || event.target.closest("button")) return;
          setDrag({ pointerX: event.clientX, pointerY: event.clientY, x: item.x, y: item.y });
        }}
      >
        <div><AppIcon app={item.app} size={15} /><strong>{item.title}</strong><span>SIMULATED</span></div>
        <div className="sl-window-actions">
          <button type="button" onClick={() => onMinimize(item.id)} aria-label={`Minimise ${item.title}`}>—</button>
          <button type="button" onClick={() => onClose(item.id)} aria-label={`Close ${item.title}`}>×</button>
        </div>
      </header>
      <div className="sl-window-content">{children}</div>
      <i className="sl-resize-hint" aria-hidden="true" />
    </section>
  );
}
