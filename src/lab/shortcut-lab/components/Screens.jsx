import { useMemo, useState } from "react";
import { challengeCategories, challenges } from "../data/challenges";
import { workflows } from "../data/workflows";
import { dateKey, masterySummary, scoreMetrics } from "../core/progress";
import { formatShortcut } from "../core/shortcuts";
import AppIcon from "./AppIcon";
import ShortcutKeys from "./ShortcutKeys";

export function Onboarding({ platform, onPlatform, onComplete, onExit }) {
  const [step, setStep] = useState(0);
  const pages = [
    { index:"01", title:"A desktop built for deliberate speed.", copy:"Shortcut Lab is a browser-contained operating system where realistic tasks become repeatable keyboard drills.", visual:<div className="sl-onboard-orbit"><i /><i /><i /><strong>⌘</strong></div> },
    { index:"02", title:"Nothing here touches your computer.", copy:"Every app, file, tab, command, message, and edit is simulated. Reserved shortcuts use a labelled training input or the on-screen keyboard.", visual:<div className="sl-safety-visual"><span>REAL OS</span><i>ISOLATED</i><strong>LAB OS</strong></div> },
    { index:"03", title:"Choose your key language.", copy:"We adapt primary modifier labels for your platform. You can change this later in Settings.", visual:<div className="sl-platform-choice"><button type="button" className={platform === "windows" ? "is-active" : ""} onClick={() => onPlatform("windows")}><strong>Ctrl</strong><span>Windows / Linux</span></button><button type="button" className={platform === "mac" ? "is-active" : ""} onClick={() => onPlatform("mac")}><strong>⌘</strong><span>macOS</span></button></div> },
    { index:"04", title:"Train. Measure. Repeat.", copy:"Start with Tutorial, press Escape to close lab overlays, and pause from the top bar at any time. Mastery is stored only in this browser.", visual:<div className="sl-onboard-stats"><span><small>REACTION</small><b>1.24s</b></span><span><small>ACCURACY</small><b>96%</b></span><span><small>COMBO</small><b>×12</b></span></div> },
  ];
  const page = pages[step];
  return <div className="sl-overlay sl-onboarding"><header><div className="sl-brand-mark">SL</div><strong>SHORTCUT LAB</strong><button type="button" onClick={onExit}>Exit lab</button></header><main><section><p>INITIALISATION / {page.index}</p><h1>{page.title}</h1><p>{page.copy}</p><div className="sl-onboard-dots">{pages.map((item, index) => <button type="button" className={index === step ? "is-active" : ""} onClick={() => setStep(index)} aria-label={`Go to onboarding step ${index + 1}`} key={item.index} />)}</div></section><aside>{page.visual}</aside></main><footer><span>{step + 1} of {pages.length}</span>{step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)}>Back</button>}<button type="button" className="is-primary" onClick={() => step === pages.length - 1 ? onComplete() : setStep((value) => value + 1)}>{step === pages.length - 1 ? "Enter Shortcut Lab" : "Continue"} <b>→</b></button></footer></div>;
}

const menuItems = [
  ["tutorial","Tutorial","Learn one shortcut at a time","01"],
  ["practice","Practice","Build mastery by category","02"],
  ["sprint","Sprint","Race the clock with instant feedback","03"],
  ["workflows","Workflows","Complete realistic multi-app missions","04"],
  ["daily","Daily challenge","A deterministic set for today","05"],
  ["library","Shortcut library","Search every safe training action","06"],
  ["progress","Progress","Review accuracy and mastery","07"],
  ["settings","Settings","Platform, sound, and motion","08"],
];

export function MainMenu({ progress, onSelect, onContinue, onExit }) {
  const summary = masterySummary(progress.mastery);
  return <div className="sl-overlay sl-menu"><header><div><div className="sl-brand-mark">SL</div><span><strong>SHORTCUT LAB</strong><small>DESKTOP PRODUCTIVITY TRAINER</small></span></div><button type="button" onClick={onExit}>Exit to Priit Lab&nbsp; ↗</button></header><main><section className="sl-menu-intro"><p>SIMULATION ONLINE <i /></p><h1>Build shortcuts<br />into <em>instinct.</em></h1><p>Practical keyboard training inside a simulated desktop. Move faster through the work you already do.</p>{progress.lastMode && <button type="button" className="sl-continue" onClick={onContinue}><span>CONTINUE</span><strong>{progress.lastMode}</strong><b>→</b></button>}<div className="sl-menu-stats"><span><small>LEARNED</small><b>{String(summary.learned).padStart(2,"0")}</b></span><span><small>MASTERY</small><b>{summary.mastered}</b></span><span><small>ACCURACY</small><b>{summary.accuracy || "—"}{summary.accuracy ? "%" : ""}</b></span></div></section><section className="sl-menu-grid">{menuItems.map(([id,title,copy,number]) => <button type="button" onClick={() => onSelect(id)} key={id}><span>{number}</span><AppIcon app={id === "library" ? "notes" : id === "workflows" ? "files" : id === "daily" ? "browser" : id === "progress" ? "sheet" : id === "settings" ? "settings" : id === "practice" ? "editor" : "terminal"} size={24} /><strong>{title}</strong><p>{copy}</p><b>↗</b></button>)}</section></main><footer><span>ALL APPLICATIONS ARE SIMULATED</span><span>LOCAL PROGRESS ONLY</span><span>PRESS ESC TO CLOSE PANELS</span></footer></div>;
}

export function PracticeSetup({ onStart, onBack }) {
  return <Panel title="Choose a practice lane" eyebrow="PRACTICE / ADAPTIVE TRAINING" onBack={onBack}><p className="sl-panel-lead">Weak shortcuts appear more often. Hints arrive after hesitation, and mastery updates after every attempt.</p><div className="sl-option-grid">{challengeCategories.map((category, index) => <button type="button" onClick={() => onStart(category.id)} key={category.id}><span>{String(index + 1).padStart(2,"0")}</span><strong>{category.label}</strong><p>{category.description}</p><b>Start →</b></button>)}</div></Panel>;
}

export function SprintSetup({ onStart, onBack }) {
  const presets = [{ label:"15 seconds", timerSeconds:15 },{ label:"30 seconds", timerSeconds:30 },{ label:"60 seconds", timerSeconds:60 },{ label:"10 challenges", count:10 },{ label:"25 challenges", count:25 },{ label:"Endless", count:100 }];
  return <Panel title="Choose your sprint" eyebrow="SPRINT / SPEED + ACCURACY" onBack={onBack}><p className="sl-panel-lead">React fast, protect your accuracy, and build a combo. Answers stay hidden until you ask for a hint.</p><div className="sl-sprint-grid">{presets.map((preset, index) => <button type="button" onClick={() => onStart(preset)} key={preset.label}><span>0{index + 1}</span><strong>{preset.label}</strong><i>{preset.timerSeconds ? "TIMED" : preset.count === 100 ? "OPEN" : "FIXED"}</i><b>Begin ↗</b></button>)}</div></Panel>;
}

export function WorkflowSetup({ onStart, onBack }) {
  return <Panel title="Select a workflow" eyebrow="WORKFLOWS / REALISTIC SEQUENCES" onBack={onBack}><p className="sl-panel-lead">Follow a continuous task across simulated apps. Every step prepares the state for the next.</p><div className="sl-workflow-grid">{workflows.map((workflow, index) => <button type="button" onClick={() => onStart(workflow)} style={{ "--workflow-accent":workflow.accent }} key={workflow.id}><span>MISSION 0{index + 1}</span><strong>{workflow.title}</strong><p>{workflow.summary}</p><div><i style={{ width:`${workflow.challengeIds.length * 9}%` }} /><b>{workflow.challengeIds.length} steps</b></div><em>Launch workflow →</em></button>)}</div></Panel>;
}

export function ShortcutLibrary({ progress, platform, onBack }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => challenges.filter((item) => (filter === "all" || item.application === filter || item.category === filter) && `${item.title} ${item.instruction} ${item.application}`.toLowerCase().includes(query.toLowerCase())), [query, filter]);
  return <Panel title="Shortcut library" eyebrow={`${challenges.length} PRACTICAL ACTIONS / SEARCHABLE`} onBack={onBack} wide><div className="sl-library-tools"><label>⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actions, apps, or outcomes" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter shortcuts by application"><option value="all">All contexts</option>{["browser","editor","terminal","files","mail","notes","sheet"].map((app) => <option value={app} key={app}>{app}</option>)}</select></div><div className="sl-library-head"><span>ACTION</span><span>CONTEXT</span><span>SHORTCUT</span><span>SAFETY</span><span>MASTERY</span></div><div className="sl-library-list">{filtered.map((item) => { const record = progress.mastery[item.id]; return <article key={item.id}><div><strong>{item.title}</strong><p>{item.instruction}</p></div><span><AppIcon app={item.application} size={16} /> {item.application}</span><div><ShortcutKeys shortcut={item.expectedShortcut} platform={platform} small />{item.trainingShortcut && <small>Train: {formatShortcut(item.trainingShortcut, platform)}</small>}</div><b className={`risk-${item.risk}`}>{item.risk.replace("-", " ")}</b><div className="sl-mastery-pips">{Array.from({ length:5 }, (_, index) => <i className={index < (record?.level || 0) ? "is-filled" : ""} key={index} />)}<small>{record?.lastPractised ? new Date(record.lastPractised).toLocaleDateString() : "Not practised"}</small></div></article>; })}</div></Panel>;
}

export function ProgressScreen({ progress, onBack }) {
  const summary = masterySummary(progress.mastery);
  const mastered = Object.entries(progress.mastery).sort(([,a],[,b]) => b.level - a.level).slice(0,6);
  return <Panel title="Your progress" eyebrow="LOCAL MASTERY / PRIVATE TO THIS BROWSER" onBack={onBack}><div className="sl-progress-hero"><div><small>SHORTCUTS LEARNED</small><strong>{summary.learned}<span> / {challenges.length}</span></strong><i><b style={{ width:`${summary.learned / challenges.length * 100}%` }} /></i></div><div><small>ALL-TIME ACCURACY</small><strong>{summary.accuracy || 0}<span>%</span></strong></div><div><small>TOTAL ATTEMPTS</small><strong>{summary.attempts}</strong></div><div><small>MASTERED</small><strong>{summary.mastered}</strong></div></div><section className="sl-progress-section"><header><strong>Strongest shortcuts</strong><span>LEVEL / 5</span></header>{mastered.length ? mastered.map(([id, record]) => { const item = challenges.find((challenge) => challenge.id === id); return <div className="sl-progress-row" key={id}><AppIcon app={item?.application} /><span><strong>{item?.title}</strong><small>{record.correctAttempts} correct · {record.averageResponseTime}ms avg</small></span><div>{Array.from({ length:5 }, (_, index) => <i className={index < record.level ? "is-filled" : ""} key={index} />)}</div></div>; }) : <p className="sl-empty-state">Complete a tutorial or practice session to start building your mastery map.</p>}</section></Panel>;
}

export function SettingsScreen({ progress, platform, onUpdate, onReplayOnboarding, onBack }) {
  return <Panel title="Lab settings" eyebrow="INPUT / ACCESSIBILITY / FEEDBACK" onBack={onBack}><div className="sl-settings-list"><Setting title="Platform labels" copy="Choose the primary modifier shown throughout training."><div className="sl-segment"><button type="button" className={platform === "windows" ? "is-active" : ""} onClick={() => onUpdate("platform","windows")}>Ctrl · Windows</button><button type="button" className={platform === "mac" ? "is-active" : ""} onClick={() => onUpdate("platform","mac")}>⌘ · macOS</button></div></Setting><Setting title="Sound feedback" copy="Lightweight tones are generated locally and muted by default."><button type="button" className={`sl-toggle ${progress.sound ? "is-active" : ""}`} onClick={() => onUpdate("sound",!progress.sound)} aria-pressed={progress.sound}><i />{progress.sound ? "On" : "Muted"}</button></Setting><Setting title="Animation intensity" copy="Reduce non-essential window and feedback movement."><div className="sl-segment"><button type="button" className={progress.motion === "full" ? "is-active" : ""} onClick={() => onUpdate("motion","full")}>Full</button><button type="button" className={progress.motion === "reduced" ? "is-active" : ""} onClick={() => onUpdate("motion","reduced")}>Reduced</button></div></Setting><Setting title="Interface size" copy="Increase lab text without changing your browser settings."><div className="sl-segment"><button type="button" className={progress.textScale === "regular" ? "is-active" : ""} onClick={() => onUpdate("textScale","regular")}>Regular</button><button type="button" className={progress.textScale === "large" ? "is-active" : ""} onClick={() => onUpdate("textScale","large")}>Large</button></div></Setting><Setting title="Onboarding" copy="Replay the safety and platform introduction."><button type="button" className="sl-secondary-button" onClick={onReplayOnboarding}>Replay introduction</button></Setting></div></Panel>;
}

export function ResultsScreen({ score, mode, previousBest = 0, onReplay, onMenu }) {
  const metrics = scoreMetrics(score);
  return <div className="sl-overlay sl-results"><header><div className="sl-brand-mark">SL</div><strong>SESSION COMPLETE</strong><span>{mode.toUpperCase()}</span></header><main><section><p>RUN ANALYSIS / COMPLETE</p><h1>{score.score.toLocaleString()}</h1><span>POINTS {score.score > previousBest ? <b>NEW PERSONAL BEST</b> : <b>{score.score - previousBest >= 0 ? "+" : ""}{score.score - previousBest} VS BEST</b>}</span></section><section className="sl-results-metrics"><div><small>ACCURACY</small><strong>{metrics.accuracy}<em>%</em></strong></div><div><small>AVG REACTION</small><strong>{(metrics.averageReaction / 1000).toFixed(2)}<em>s</em></strong></div><div><small>FASTEST</small><strong>{score.fastest === null ? "—" : (score.fastest / 1000).toFixed(2)}<em>{score.fastest === null ? "" : "s"}</em></strong></div><div><small>BEST COMBO</small><strong>×{score.bestCombo}</strong></div></section><section className="sl-results-timeline"><header><strong>RESPONSE TIMELINE</strong><span>{score.correct} correct · {score.incorrect} missed</span></header><div>{score.timeline.map((entry,index) => <i className={entry.correct ? "is-correct" : "is-wrong"} style={{ height:`${Math.max(18, Math.min(100, 110 - entry.responseMs / 45))}%` }} key={index}><span>{entry.correct ? `${(entry.responseMs / 1000).toFixed(1)}s` : "miss"}</span></i>)}</div></section><footer><div><small>NEXT RECOMMENDATION</small><strong>{metrics.accuracy < 85 ? "Practice weak shortcuts" : "Try a timed sprint"}</strong></div><button type="button" onClick={onMenu}>Main menu</button><button type="button" className="is-primary" onClick={onReplay}>Run it again&nbsp; ↗</button></footer></main></div>;
}

export function PauseScreen({ onResume, onReset, onMenu }) {
  return <div className="sl-modal-backdrop"><section className="sl-pause-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title"><span>SESSION SUSPENDED</span><h2 id="pause-title">Take a breath.</h2><p>The timer and challenge reaction clock are paused. No input is being scored.</p><button type="button" className="is-primary" onClick={onResume}>Resume session <b>→</b></button><button type="button" onClick={onReset}>Reset desktop layout</button><button type="button" onClick={onMenu}>End session</button></section></div>;
}

function Panel({ title, eyebrow, onBack, wide = false, children }) {
  return <div className={`sl-overlay sl-panel ${wide ? "is-wide" : ""}`}><header><button type="button" onClick={onBack}>← Main menu</button><div className="sl-brand-mark">SL</div></header><main><p>{eyebrow}</p><h1>{title}</h1>{children}</main></div>;
}

function Setting({ title, copy, children }) {
  return <section><div><strong>{title}</strong><p>{copy}</p></div>{children}</section>;
}

export function DailyIntro({ completed, onStart, onBack }) {
  return <Panel title="Today’s circuit" eyebrow={`DAILY CHALLENGE / ${dateKey().replaceAll("-",".")}`} onBack={onBack}><div className="sl-daily-card"><span>10 SHORTCUTS</span><strong>A balanced test of navigation, editing, and command-line reflexes.</strong><p>The set is the same for everyone on this date. Your score and completion stay in this browser.</p>{completed && <em>✓ Completed today · best {completed.score.toLocaleString()}</em>}<button type="button" onClick={onStart}>{completed ? "Run again" : "Start daily challenge"} <b>↗</b></button></div></Panel>;
}
