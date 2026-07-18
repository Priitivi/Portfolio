import { useEffect, useRef, useState } from "react";

const outputs = {
  "npm run build": ["> portfolio@0.0.0 build", "✓ 493 modules transformed", "dist ready in 1.24s"],
  "npm test": ["TAP version 13", "# tests 30", "# pass 30", "# fail 0"],
  "git status": ["On branch codex/shortcut-lab", "Changes not staged for commit"],
  "git diff": ["+ feat(shortcut-lab): train faster", "1 file changed, 18 insertions(+)"],
  ls: ["src   public   tests   package.json   README.md"],
  pwd: ["/portfolio"],
  clear: [],
};

export default function FakeTerminal({ effect }) {
  const [entries, setEntries] = useState([{ command:"npm run build", output:outputs["npm run build"] }]);
  const [value, setValue] = useState("");
  const [history] = useState(["git status", "npm test", "npm run build"]);
  const [historyIndex, setHistoryIndex] = useState(history.length);
  const [running, setRunning] = useState(false);
  const inputRef = useRef(null);
  const lastEffect = useRef(0);

  useEffect(() => {
    if (!effect?.nonce || effect.nonce === lastEffect.current) return;
    lastEffect.current = effect.nonce;
    if (effect.action === "clear-terminal") setEntries([]);
    if (effect.action === "history-up") { setHistoryIndex((index) => Math.max(0, index - 1)); setValue(history[Math.max(0, historyIndex - 1)] || ""); }
    if (effect.action === "history-down") { setHistoryIndex((index) => Math.min(history.length, index + 1)); setValue(history[Math.min(history.length, historyIndex + 1)] || ""); }
    if (effect.action === "cancel-process") { setRunning(false); setEntries((items) => [...items, { command:"", output:["^C process interrupted"] }]); }
    if (effect.action === "line-start") inputRef.current?.setSelectionRange(0, 0);
    if (effect.action === "line-end") inputRef.current?.setSelectionRange(value.length, value.length);
  }, [effect, history, historyIndex, value.length]);

  const execute = () => {
    const command = value.trim();
    if (!command) return;
    if (command === "clear") setEntries([]);
    else if (command.startsWith("cd")) setEntries((items) => [...items, { command, output:[] }]);
    else setEntries((items) => [...items, { command, output:outputs[command] || [`command not found: ${command.split(" ")[0]}`] }]);
    setRunning(command === "npm run dev");
    setValue("");
    setHistoryIndex(history.length);
  };

  return (
    <div className="sl-terminal-app" onClick={() => inputRef.current?.focus()}>
      <header><span>shortcut-lab — zsh</span><div><button type="button">＋</button><button type="button">⌄</button></div></header>
      <main>
        <div className="sl-terminal-welcome"><strong>SHORTCUT LAB SHELL</strong><span>Sandboxed command simulator · no real commands execute</span></div>
        {entries.map((entry, index) => <div className="sl-terminal-entry" key={`${entry.command}-${index}`}><p><span>priit</span><b>@lab</b><em> ~/portfolio</em> <i>›</i> {entry.command}</p>{entry.output.map((line) => <pre key={line}>{line}</pre>)}</div>)}
        {running && <pre className="is-running">watching for file changes…</pre>}
        <label className="sl-terminal-prompt"><span>priit</span><b>@lab</b><em> ~/portfolio</em><i>›</i><input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Enter") execute(); }} aria-label="Simulated terminal command" autoComplete="off" /></label>
      </main>
      <footer>LOCAL SIMULATION <span>UTF-8</span><span>zsh</span></footer>
    </div>
  );
}
