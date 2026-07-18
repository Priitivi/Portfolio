import { useEffect, useState } from "react";
import AppIcon from "./AppIcon";
import AppWindow from "./AppWindow";
import ChallengeHUD from "./ChallengeHUD";
import VirtualKeyboard from "./VirtualKeyboard";
import FakeBrowser from "../apps/FakeBrowser";
import FakeEditor from "../apps/FakeEditor";
import FakeTerminal from "../apps/FakeTerminal";
import FakeFiles from "../apps/FakeFiles";
import ProductivityApp from "../apps/ProductivityApp";
import { appMeta } from "./windowConfig";

export default function DesktopShell({ windows, activeApp, effect, session, challenge, platform, score, feedback, hintVisible, pressed, onHint, onPause, onSkip, onWindowAction, onVirtualShortcut, onMenu, onSettings, onFullscreen }) {
  const [clock, setClock] = useState(new Date());
  const [keyboardOpen, setKeyboardOpen] = useState(true);
  const [launcher, setLauncher] = useState(false);

  useEffect(() => {
    const timer = globalThis.setInterval(() => setClock(new Date()), 30000);
    return () => globalThis.clearInterval(timer);
  }, []);

  return <main className="sl-desktop">
    <div className="sl-wallpaper" aria-hidden="true"><i /><i /><span>SHORTCUT<br />LAB</span><b>BUILD / 01</b></div>
    <header className="sl-system-bar"><div><button type="button" className="sl-system-logo" onClick={onMenu} aria-label="Open main menu">SL</button><strong>Shortcut Lab</strong><span>{appMeta[activeApp]?.title || "Desktop"}</span></div><div><button type="button" onClick={() => setKeyboardOpen((value) => !value)}>⌨ <span>Keyboard</span></button><button type="button" onClick={onPause}>Ⅱ <span>Pause</span></button><button type="button" onClick={onSettings}>⚙ <span>Settings</span></button><button type="button" onClick={onFullscreen}>⌗ <span>Fullscreen</span></button><i aria-label="System online" /> <time>{clock.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</time></div></header>
    <section className="sl-desktop-stage">
      {windows.map((item) => <AppWindow item={item} active={activeApp === item.id} onFocus={(id) => onWindowAction("focus",id)} onClose={(id) => onWindowAction("close",id)} onMinimize={(id) => onWindowAction("minimize",id)} onMove={(id,position) => onWindowAction("move",id,position)} key={item.id}>{renderApp(item.app, effect?.app === item.app ? effect : null)}</AppWindow>)}
    </section>
    <ChallengeHUD challenge={challenge} session={session} platform={platform} score={score} feedback={feedback} hintVisible={hintVisible} onHint={onHint} onPause={onPause} onSkip={onSkip} />
    {keyboardOpen && <div className="sl-keyboard-drawer"><button type="button" onClick={() => setKeyboardOpen(false)} aria-label="Close virtual keyboard">×</button><VirtualKeyboard required={challenge.expectedShortcut} platform={platform} pressed={pressed} onShortcut={onVirtualShortcut} /></div>}
    {launcher && <div className="sl-launcher"><header><strong>APPLICATIONS</strong><button type="button" onClick={() => setLauncher(false)}>×</button></header>{Object.entries(appMeta).map(([app,meta]) => <button type="button" onClick={() => { onWindowAction("open",app); setLauncher(false); }} key={app}><i style={{ background:meta.color }}><AppIcon app={app} /></i><span><strong>{meta.title}</strong><small>Simulated {app}</small></span></button>)}</div>}
    <nav className="sl-dock" aria-label="Simulated applications"><button type="button" className="sl-launch-button" onClick={() => setLauncher((value) => !value)} aria-label="Open application launcher">SL</button><i />{Object.entries(appMeta).map(([app,meta]) => { const item = windows.find((entry) => entry.app === app); return <button type="button" className={`${activeApp === app ? "is-active" : ""} ${item?.open ? "is-open" : ""}`} style={{ "--app-accent":meta.color }} onClick={() => onWindowAction("open",app)} aria-label={`Open ${meta.title}`} key={app}><AppIcon app={app} /><span>{meta.title}</span></button>; })}</nav>
  </main>;
}

function renderApp(app, effect) {
  if (app === "browser") return <FakeBrowser effect={effect} />;
  if (app === "editor") return <FakeEditor effect={effect} />;
  if (app === "terminal") return <FakeTerminal effect={effect} />;
  if (app === "files") return <FakeFiles effect={effect} />;
  return <ProductivityApp app={app} effect={effect} />;
}
