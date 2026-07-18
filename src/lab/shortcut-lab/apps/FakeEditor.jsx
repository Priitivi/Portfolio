import { useEffect, useRef, useState } from "react";

const baseLines = [
  "export async function requestWithRetry(url) {",
  "  const retryDelay = 800;",
  "  const response = await fetch(url);",
  "  if (!response.ok) throw new Error('Request failed');",
  "  return response.json();",
  "}",
];

export default function FakeEditor({ effect }) {
  const [overlay, setOverlay] = useState(null);
  const [terminal, setTerminal] = useState(false);
  const [lines, setLines] = useState(baseLines);
  const [saved, setSaved] = useState(true);
  const [selection, setSelection] = useState(1);
  const lastEffect = useRef(0);

  useEffect(() => {
    if (!effect?.nonce || effect.nonce === lastEffect.current) return;
    lastEffect.current = effect.nonce;
    const action = effect.action;
    if (["quick-open","find-code","replace-code","command-palette","rename-symbol"].includes(action)) setOverlay(action);
    if (action === "toggle-terminal") setTerminal((value) => !value);
    if (action === "save-file") setSaved(true);
    if (action === "toggle-comment") { setLines((items) => items.map((line, index) => index === selection ? `  // ${line.trim()}` : line)); setSaved(false); }
    if (action === "duplicate-line") { setLines((items) => [...items.slice(0, selection + 1), items[selection], ...items.slice(selection + 1)]); setSaved(false); }
    if (action === "delete-word") { setLines((items) => items.map((line, index) => index === 1 ? line.replace("const ", "") : line)); setSaved(false); }
    if (action === "move-line-up") setSelection((value) => Math.max(0, value - 1));
    if (action === "move-line-down") setSelection((value) => Math.min(lines.length - 1, value + 1));
    if (action === "select-match") setOverlay("multi-cursor");
  }, [effect, selection, lines.length]);

  const overlayCopy = {
    "quick-open":["GO TO FILE", "apiClient.js"],
    "find-code":["FIND", "retryDelay     3 results"],
    "replace-code":["REPLACE", "retryDelay  →  backoffMs"],
    "command-palette":["> COMMAND", "Format document"],
    "rename-symbol":["RENAME SYMBOL", "backoffMs"],
    "multi-cursor":["MULTI-CURSOR", "2 matches selected"],
  };

  return (
    <div className="sl-editor-app">
      <aside className="sl-editor-rail"><b>◇</b><b>⌕</b><b>⑂</b><b>▦</b><i /></aside>
      <aside className="sl-file-tree"><header>EXPLORER <span>•••</span></header><strong>⌄ PROJECT-AURORA</strong><p>⌄ src</p><button type="button" className="is-active">◇ apiClient.js</button><button type="button">◇ retry.js</button><button type="button">◇ metrics.js</button><p>› tests</p><button type="button"># package.json</button></aside>
      <section className="sl-code-pane">
        <div className="sl-editor-tabs"><span className="is-active">◇ apiClient.js {saved ? "" : "●"}</span><span>◇ retry.js</span></div>
        <div className="sl-code-breadcrumb">src  ›  apiClient.js  ›  <strong>requestWithRetry</strong></div>
        {overlayCopy[overlay] && <div className="sl-editor-overlay"><small>{overlayCopy[overlay][0]}</small><strong>{overlayCopy[overlay][1]}</strong><span>↵ to open · esc to dismiss</span></div>}
        <div className="sl-code-lines">{lines.map((line, index) => <div className={index === selection ? "is-selected" : ""} key={`${line}-${index}`} onClick={() => setSelection(index)}><span>{index + 1}</span><code>{colourCode(line)}</code></div>)}</div>
        {terminal && <div className="sl-editor-terminal"><header>TERMINAL <span>PROBLEMS&nbsp; 0</span><i /></header><p><em>portfolio</em> <b>›</b> npm run build</p><p className="is-output">✓ 493 modules transformed. ready in 1.2s</p><p><em>portfolio</em> <b>›</b> <i /></p></div>}
        <footer><span>main*</span><span>Ln {selection + 1}, Col 18</span><span>UTF-8&nbsp;&nbsp; JavaScript&nbsp;&nbsp; Prettier</span></footer>
      </section>
    </div>
  );
}

function colourCode(line) {
  const parts = line.split(/(export|async|function|const|await|if|throw|return|new|800|true|false)/g);
  return parts.map((part, index) => <span className={/^(export|async|function|const|await|if|throw|return|new)$/.test(part) ? "token-keyword" : /^\d+$/.test(part) ? "token-number" : ""} key={`${part}-${index}`}>{part}</span>);
}
