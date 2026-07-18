# Priitivi — Creative Developer Portfolio

An interactive portfolio that treats personal work as a set of playable interfaces. The public site combines an editorial landing page, a character-creation boss fight, and a protected experimental Lab containing real-time Web Audio and WebGL projects.

Live site: [priitivi.com](https://priitivi.com)

## What is here?

### Main portfolio

- Editorial hero, biography, project case files, CV download, and contact form.
- A responsive 2D presentation built for clarity before spectacle.
- An animated crashed UFO and navbar entry that lead to Priit's Lab.
- A lazy-loaded 3D fighter available directly from the hero and navigation.

### Portfolio Fighter

- Character creator with configurable appearance, clothing, and weapon.
- Comic-book story introduction and guided controls.
- Procedural 3D boss arena with attacks, dodging, health phases, and a caped boss.
- Portfolio information unlocked between combat phases.
- Keyboard and touch controls.

### Priit's Lab

The Lab is a protected route at `/lab`. Its experiments are loaded only after the Lab bundle is requested.

1. **Psychedelic Audio Reactor** — upload a local track and transform its waveform, frequency bands, stereo balance, and detected beats into four real-time visual systems.
2. **The Paper Drifter** — explore a 5,400-pixel 2D paper world where mouse or touch strokes become physical platforms. Draw routes, paint-dash across gaps, and restore four landmarks in any order while choosing from fourteen local tracks.
3. **Fluid Lab** — disturb a full-screen, pressure-solved GPU fluid field with mouse, pen, or touch. Pointer velocity injects momentum while six palettes, live solver controls, adaptive resolution, fullscreen, and keyboard shortcuts make the simulation feel like an instrument.
4. **Shortcut Lab** — train practical productivity shortcuts inside a contained simulated desktop. Tutorial, adaptive practice, timed sprints, deterministic daily sets, and three multi-app workflows run across fake browser, editor, terminal, files, mail, notes, and spreadsheet applications.
5. **The Deceptive Trial** — play a twelve-level storybook precision platformer whose traps subvert learned rules instead of relying on randomness. It includes checkpoints, secrets, 32 achievements, local statistics, generated audio, remappable controls, and touch input.

## Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| UI | React 19 | Components and application state |
| Build | Vite 6 | Development server, code splitting, and production builds |
| 3D | Three.js + React Three Fiber | Procedural characters, environments, shaders, particles, and game loops |
| 2D | Canvas 2D API | Paper-world rendering, drawing, particles, and platform physics |
| GPU simulation | WebGL2 + GLSL ES 3.0 | Multi-pass fluid advection, pressure projection, vorticity, dye, and display shading |
| Motion | Framer Motion | Landing-page transitions |
| Styling | Tailwind CSS + custom CSS | Utility styles and bespoke visual systems |
| Audio | Web Audio API | FFT analysis, waveform energy, beat detection, and local playback |
| Auth | Netlify Functions + Node crypto | Password verification and signed Lab sessions |
| Tests | Node test runner | Security, analysis, and gameplay helper tests |

## Architecture at a glance

```mermaid
flowchart TD
    Entry[main.jsx] --> App[App.jsx]
    App --> Portfolio[Standard portfolio]
    App --> Fighter[Lazy GameExperience]
    App --> Lab[Lazy LabApp]
    Lab --> Gate[LabGate]
    Gate --> Session[Netlify session function]
    Lab --> Dashboard[LabHome]
    Dashboard --> Reactor[Lazy AudioReactor]
    Dashboard --> Painter[Lazy PaintSurfer]
    Dashboard --> Fluid[Lazy FluidLab]
    Dashboard --> Shortcuts[Lazy ShortcutLab]
    Dashboard --> Trial[Lazy DeceptiveTrial]
    Reactor --> WebAudio[AudioEngine + analysis]
    Reactor --> ReactorScene[Four R3F scenes]
    Painter --> PaperCanvas[PaperWorldCanvas loop]
    PaperCanvas --> Drawing[World-space paint terrain]
    PaperCanvas --> Story[Four open-order landmarks]
    Fluid --> Solver[FluidSimulation controller]
    Solver --> Fields[Velocity + dye + pressure framebuffers]
    Fields --> Passes[Advection + curl + divergence + Jacobi + projection]
    Shortcuts --> ShortcutEngine[Challenge + scoring engine]
    Shortcuts --> SafeInput[Shortcut safety manager]
    Shortcuts --> FakeDesktop[Window manager + simulated apps]
    ShortcutEngine --> LocalMastery[Adaptive local mastery]
    Trial --> TrialEngine[Fixed-step Canvas 2D engine]
    TrialEngine --> TrialLevels[Data-driven 12-level campaign]
    TrialEngine --> TrialProgress[Local saves + stats + achievements]
```

The application intentionally uses a small route boundary instead of a full routing dependency. `App.jsx` delegates `/lab` paths to `LabApp`, and `LabApp` tracks its nested pathname with the History API. Each expensive interactive experience is imported with `React.lazy`, keeping it out of the initial portfolio bundle.

## Project structure

```text
Portfolio/
├─ netlify/
│  └─ functions/
│     ├─ lab-session.mjs          # Login, session validation, and logout
│     └─ _shared/lab-security.mjs # Scrypt hashing and signed-session helpers
├─ public/
│  └─ audio/                      # Paper Drifter soundtrack assets
├─ scripts/
│  └─ hash-lab-password.mjs       # Hidden-input password hash helper
├─ src/
│  ├─ components/                 # Public portfolio sections and UFO portal
│  ├─ data/                       # Portfolio and fighter content
│  ├─ game/
│  │  ├─ GameExperience.jsx       # Fighter state machine and interface
│  │  ├─ ArenaScene.jsx           # Real-time combat scene
│  │  └─ game.css
│  ├─ lab/
│  │  ├─ auth/                    # Browser calls to the session endpoint
│  │  ├─ audio-reactor/
│  │  │  ├─ audio/                # FFT bands, amplitude, centroid, and beats
│  │  │  ├─ hooks/                # Analysis loop and adaptive quality
│  │  │  └─ scene/                # Neural, liquid, astral, and collapse modes
│  │  ├─ paint-surfer/
│  │  │  ├─ PaintSurfer.jsx       # Game shell, HUD, music, and controls
│  │  │  ├─ PaperWorldCanvas.jsx  # 2D renderer, physics, paint, and camera
│  │  │  ├─ paperWorld.js         # Pure world, collision, and story helpers
│  │  │  └─ usePaintControls.js   # Persistent keyboard input state
│  │  ├─ fluid-lab/
│  │  │  ├─ FluidLab.jsx           # Chamber shell, input, shortcuts, fullscreen, and fallback UI
│  │  │  ├─ FluidControls.jsx      # Palettes, solver sliders, quality, and actions
│  │  │  ├─ FluidSimulation.js     # Raw WebGL2 pipeline, framebuffers, passes, and lifecycle
│  │  │  ├─ fluidConfig.js         # Palettes, presets, defaults, and pure helpers
│  │  │  ├─ shaders.js             # GLSL programs for every solver and display pass
│  │  │  └─ fluid-lab.css
│  │  ├─ deceptive-trial/
│  │  │  ├─ DeceptiveTrial.jsx     # Menus, saves, settings, results, and route shell
│  │  │  ├─ GameCanvas.jsx         # Canvas lifecycle, HUD, and mobile controls
│  │  │  ├─ TrialMenu.jsx          # Menu, levels, achievements, statistics, and settings
│  │  │  ├─ engine/                # Physics, collision, rendering, audio, rules, input, and level data
│  │  │  ├─ README.md              # Engine and level-authoring guide
│  │  │  └─ deceptive-trial.css
│  │  ├─ LabApp.jsx               # Protected Lab route boundary
│  │  └─ LabHome.jsx              # Experiment dashboard
│  ├─ App.jsx                     # Top-level experience switch
│  └─ index.css                   # Public portfolio visual system
├─ tests/                         # Node security, Function, audio, and game tests
└─ netlify.toml                   # Build, Function, and SPA redirect rules
```

## How the interesting systems work

### 1. Protected Lab sessions

The password never enters the client bundle. A Netlify Function receives the submitted password and compares it with a salted scrypt hash using a timing-safe comparison. A successful login returns a signed, short-lived cookie with these properties:

- `HttpOnly` — unavailable to browser JavaScript.
- `Secure` — sent only over HTTPS in production.
- `SameSite=Strict` — resists cross-site requests.
- 30-minute expiry.

The gate is access control for the route, not a secrecy boundary for compiled frontend code. Never put confidential data inside a static client bundle.

### 2. Audio Reactor pipeline

`AudioEngine` creates one media element and connects it to Web Audio analysers. Every animation frame produces a small mutable analysis object containing:

- RMS-style waveform amplitude.
- Sub-bass, bass, low-mid, mid, high-mid, and treble energy.
- Spectral centroid for perceived brightness.
- Stereo balance from split left/right channels.
- Beat impulses from a moving energy history and cooldown.

React does not rerender at audio frequency. The analyser writes into refs, and React Three Fiber scenes read those refs inside `useFrame`. This keeps high-frequency work out of the component render cycle.

### 3. Paper Drifter game loop

`PaperWorldCanvas` is a Canvas 2D game loop with a fixed logical world and a smooth horizontal camera. Player position, velocity, coyote-time jumping, dash state, particles, paint strokes, and camera position live in refs. Keyboard and touch inputs live in a `Set`, so simultaneous controls never need frame-rate React rerenders.

Drawing is also level design:

1. Pointer coordinates are transformed from screen space into persistent world space.
2. Each stroke is stored as a capped polyline and rendered with ink, pigment, and highlight passes.
3. Descending player feet sample nearby line segments, turning suitable strokes into walkable platforms and ramps.
4. Paint cells near a landmark restore its colour without forcing a fixed completion order.

Only user-facing values—total restoration, landmark status, dash count, dialogs, and music state—use React state. The animation loop remains mutable and allocation-conscious. The soundtrack UI exposes all fourteen supplied tracks while the browser loads only the selected source.

### 4. Fluid Lab solver

`FluidSimulation` owns a raw WebGL2 pipeline so the numerical work stays on the GPU and React only handles human-scale UI state. Every animation frame runs this sequence:

1. Pointer samples add dye to the colour field and velocity to the momentum field through GPU splat passes.
2. Curl is measured from velocity and vorticity confinement restores small rotating structures.
3. Divergence measures where the provisional velocity field is compressing or expanding.
4. A ping-pong Jacobi solve iterates the pressure field between two floating-point framebuffers.
5. The pressure gradient is subtracted from velocity, projecting it toward an incompressible field.
6. Velocity and dye are each advected through the corrected flow with configurable dissipation.
7. A final display shader tone-maps the dye, adds subtle surface lighting, vignette, and dithering, then draws to the screen.

Velocity, dye, and pressure each use paired floating-point render targets; divergence and curl use dedicated single targets. The controller reallocates them from aspect-aware quality presets, caps display DPR, suspends updates in hidden tabs, and deletes every texture, framebuffer, program, vertex array, observer, listener, and animation frame when the route unmounts. WebGL2 and `EXT_color_buffer_float` are checked before the chamber opens; unsupported devices receive a readable fallback rather than a broken canvas.

React deliberately does not receive per-frame simulation data. Pointer records and the solver live in refs, while the only recurring UI update is one small performance sample per second. This prevents the fluid loop from becoming a React render loop.

### 5. Shortcut Lab architecture

Shortcut Lab is lazy-loaded at `/lab/shortcut-lab` after Lab authentication. It has no backend, account, paid service, external font, or added runtime dependency. Its simulated applications never execute commands, open browser tabs, or access files.

The experience is split into four layers:

1. `data/challenges.js` defines the curriculum. Every challenge names an application, category, difficulty, platform support, expected shortcut, optional safe training chord, risk class, initial/success state, explanation, action, and points. Workflows reference challenge IDs instead of duplicating challenge logic.
2. `core/shortcuts.js` normalizes keyboard events, applies macOS modifier mapping, requires exact modifier matches, diagnoses near misses, and classifies reserved chords. The global listener ignores repeated events and real form controls, only prevents default after an accepted safe/training input, and is removed on unmount.
3. `core/progress.js` owns pure scoring, combo, accuracy, mastery, adaptive weighting, deterministic daily selection, and defensive persistence parsing. Incorrect, slow, hinted, or stale shortcuts receive greater practice weight.
4. `ShortcutLab.jsx` coordinates modes, timers, feedback, window focus, simulated app effects, optional locally generated sound, pausing, results, and persistence. Fake apps are split across `apps/`; the desktop, windows, screens, HUD, and virtual keyboard live under `components/`.

#### Shortcut safety model

Shortcut risk is one of `safe`, `browser-reserved`, or `os-reserved`. The browser and operating system have final control over reserved shortcuts; the lab does not claim otherwise and does not use `beforeunload` as a guard.

- Safe and reliably interceptable application chords run inside the simulated app.
- Browser-reserved actions such as real tab close, new tab, restore tab, tab cycling, and address focus display the real chord but train with a labelled substitute or the clickable virtual keyboard.
- Operating-system actions such as `Alt + Tab` and `Win + D` use explicit lab-only substitutes.
- `Alt + F4`, `F5`, `Ctrl + R`, `Win + L`, `Ctrl + Shift + Escape`, and `Cmd + Q` are registered as reserved and are never assigned as physical challenge inputs.
- Inputs, textareas, selects, and editable content do not feed the global challenge listener.

The current safe substitutions are:

| Real action | Real shortcut | Lab training input |
| --- | --- | --- |
| Focus address bar | `Ctrl/Cmd + L` | `Ctrl/Cmd + Alt/Option + Shift + L` |
| Restore tab | `Ctrl/Cmd + Shift + T` | `Ctrl/Cmd + Alt/Option + Shift + R` |
| Next / previous tab | `Ctrl/Cmd + Tab` / `Ctrl/Cmd + Shift + Tab` | `Alt/Option + Shift + Right/Left` |
| Close / new tab | `Ctrl/Cmd + W` / `Ctrl/Cmd + T` | `Ctrl/Cmd + Alt/Option + Shift + W/N` |
| Switch application | `Alt/Option + Tab` | `Ctrl/Cmd + Alt/Option + Shift + A` |
| Show desktop | `Win + D` | `Ctrl/Cmd + Alt/Option + Shift + D` |

#### Modes, progress, and supported platforms

- Tutorial teaches eight core actions, then repeats them without visible answers.
- Practice selects an app/category and weights weaker or stale shortcuts more heavily.
- Sprint supports 15/30/60-second and 10/25/open challenge presets.
- Workflows provide three continuous scenarios: fix and test a project, research and summarise an issue, and organise files and send an update.
- Daily Challenge hashes the local calendar date into the same ten-item set for that day.
- Results include score, accuracy, average/fastest reaction, combo, personal-best comparison, and an attempt timeline.

Windows/Linux uses `Ctrl`, `Alt`, and `Win` labels. macOS maps primary `Ctrl` definitions to `⌘` and displays `⌥` for Alt. The preference and all progress live under `priit-shortcut-lab-v1` in `localStorage`. Corrupt or unavailable storage falls back safely to defaults. Touch devices can browse tutorials and use the virtual keyboard; full muscle-memory training is intentionally described as a physical-keyboard experience.

#### Adding a challenge or simulated app

To add a challenge:

1. Add a unique object through `makeChallenge` in `data/challenges.js`.
2. Use an existing action or handle a new action in the target fake app.
3. Mark reserved input honestly and provide `trainingShortcut` when physical capture is unsafe.
4. If it belongs in a workflow, reference its ID in `data/workflows.js`.
5. Extend `tests/shortcut-lab.test.mjs` when normalization, safety, scoring, or selection behavior changes.

To add an app, create a focused component in `apps/`, register its label, accent, and initial window in `components/windowConfig.js`, render it from `DesktopShell.jsx`, and add application-specific challenges. Fake terminal commands must remain allow-listed simulations; fake file and browser actions must remain in local React state.

Known limitations: browsers differ in reserved-shortcut delivery; fullscreen can be declined by browser policy; window dragging and resizing prioritize desktop pointers; progress is local to one browser profile; and there is no cross-device account or leaderboard by design.

### 6. The Deceptive Trial engine

The Deceptive Trial is lazy-loaded at `/lab/deceptive-trial`. React owns human-scale interface state while `GameEngine` runs a 120 Hz fixed physics step and a display-rate Canvas 2D renderer without causing per-frame React renders. The campaign is entirely data-driven: platforms, hazards, triggers, signs, NPCs, collectibles, checkpoints, secrets, goals, and decorations are parsed into isolated runtime clones.

Movement includes ground and air acceleration, separate friction, run speed, coyote time, jump buffering, variable jump height, gravity reversal, collision resolution, landing squash, dust, death particles, camera dead zones, velocity look-ahead, and instant checkpoint respawns. Reusable trigger actions create the expectation traps—speed-sensitive bridges, delayed falling hazards, mid-jump wind changes, mirrored input, fake checkpoints, fake exits, and gravity changes—while the level data supplies the timing and foreshadowing.

`priit-deceptive-trial-v1` stores only local progress, settings, best times, statistics, secrets, and achievements. Defensive parsing restores defaults when storage is corrupt or unavailable. Audio cues and two campaign mood families are synthesized with Web Audio; no borrowed game art or sound assets are shipped.

See [The Deceptive Trial engineering guide](src/lab/deceptive-trial/README.md) for architecture, engine and collision details, save and achievement design, performance strategy, folder structure, level/hazard/enemy/achievement authoring, limitations, and development commands.

### 7. Performance strategy

- Large experiences are route-level lazy chunks.
- Device heuristics lower particles, shadows, geometry, and pixel ratio on modest hardware.
- The Audio Reactor can reduce DPR dynamically when frame times remain slow.
- Paper-world rendering caps device pixel ratio, stroke count, points per stroke, and particles.
- Physics examines only recent paint strokes instead of every historical mark.
- Hidden tabs suspend the audio context and animation work where possible.
- Reduced-motion preferences lower camera and interface movement.
- Fluid buffers scale independently from display pixels, manual bilinear advection works without float-linear filtering, and Auto quality steps down after sustained slow frames.
- Fluid Lab is a lazy route chunk and adds no shader compilation or framebuffers to the main portfolio, fighter, Audio Reactor, or Paper Drifter.
- Shortcut Lab is a route-level lazy chunk, uses CSS/vector UI instead of image assets, adds no dependency, and removes timers and keyboard listeners when inactive or unmounted.
- The Deceptive Trial is a 59 kB lazy JavaScript chunk before gzip, caps DPR at 2, caps particles, uses viewport culling through Canvas clipping, keeps runtime objects mutable, and sends HUD updates to React at 10 Hz instead of every frame.

## Getting started

Requirements:

- Node.js 20 or newer.
- npm.
- Netlify CLI for the authenticated Lab workflow.

```bash
git clone https://github.com/Priitivi/Portfolio.git
cd Portfolio
npm ci
```

### Public portfolio preview

```bash
npm run dev
```

This is enough for the public portfolio and 3D fighter. It does not run the Lab authentication Function.

### Full local Lab preview

Generate a password hash:

```bash
npm run lab:hash-password
```

Create an uncommitted `.env` file:

```dotenv
LAB_PASSWORD_HASH=scrypt$your_generated_value
LAB_SESSION_SECRET=use-a-random-secret-at-least-32-characters-long
```

Then start the Netlify development runtime:

```bash
npx netlify dev
```

Open `http://localhost:8888/lab`.

Do not commit `.env`, place secrets in `netlify.toml`, or expose the plaintext password through a `VITE_` variable.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite public-site preview |
| `npx netlify dev` | Start Vite with local redirects and Functions |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run preview` | Preview the production bundle |
| `npm run lint` | Run ESLint across the repository |
| `npm test` | Run security, Function, audio, and gameplay tests |
| `npm run lab:hash-password` | Generate a salted Lab password hash |

## Testing

```bash
npm run lint
npm test
npm run build
```

The tests cover:

- Password hashing, timing-safe verification, session expiry, and tamper rejection.
- Login, signed-cookie restoration, invalid clearance, and logout Function behavior.
- Supported audio formats, frequency measurements, stereo balance, beat cooldowns, and transport formatting.
- 2D movement actions, screen-to-world drawing transforms, paint-platform sampling, open-order story progression, and all soundtrack assets.
- The Deceptive Trial campaign schema, upright and reversed-gravity collision, checkpoints, trigger and bridge rules, victory conditions, save recovery, persistence, and achievement milestones.
- Fluid palettes, automatic quality heuristics, aspect-aware framebuffer sizing, WebGL pointer mapping, reduced-motion defaults, and the presence of every required solver stage.
- Shortcut normalization, exact modifiers, platform labels, risk classification, safe training input, scoring, combo reset, mastery updates, deterministic daily sets, persistence recovery, curriculum size, and workflow references.

Interactive changes should also be checked in a browser at desktop and mobile widths because WebGL capability, Canvas pointer input, autoplay policy, and graphics performance differ by device.

## Deployment

The project is configured for Netlify:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- SPA rewrites: `/lab` and `/lab/*`
- Function rewrite: `/lab/api/session`

Add `LAB_PASSWORD_HASH` and `LAB_SESSION_SECRET` through the Netlify environment-variable UI, then redeploy so Functions receive them.

## Audio and usage note

Files under `public/audio` are media supplied specifically for this portfolio and are not automatically covered by any source-code reuse permission. Confirm that you hold the necessary public-performance and redistribution rights before deploying or forking those tracks; otherwise replace them with properly licensed audio and update `soundtracks.js`.

This repository is available to study and learn from. Please credit Priitivi Ravi if reusing substantial visual or gameplay concepts, and check individual media rights separately.

## Contact

- Website: [priitivi.com](https://priitivi.com)
- GitHub: [@Priitivi](https://github.com/Priitivi)
- Email: [priitivi@gmail.com](mailto:priitivi@gmail.com)
