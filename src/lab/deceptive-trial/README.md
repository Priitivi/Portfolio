# The Deceptive Trial engineering guide

The Deceptive Trial is an original, local-first Canvas 2D precision platformer at `/lab/deceptive-trial`. Its design rule is simple: every death should expose a readable exception to a rule the game has already taught. Random deaths, invisible spikes without clues, copied art, remote services, and punitive reloads are deliberately outside the design.

## Architecture

The route is registered in `LabApp.jsx` with `React.lazy`, so no game code is evaluated on the portfolio, fighter, Lab gate, or other experiment routes. The dashboard metadata lives in `experiments.js` and the route-specific presentation stays inside this folder.

```text
deceptive-trial/
├─ DeceptiveTrial.jsx       Menu state, save updates, achievements, settings, results
├─ GameCanvas.jsx           Canvas and input lifecycle, HUD, touch controls
├─ TrialMenu.jsx            Menu, level select, achievements, statistics, settings, credits
├─ deceptive-trial.css      Responsive storybook shell and overlays
└─ engine/
   ├─ AudioEngine.js        Generated Web Audio cues and ambient voices
   ├─ constants.js          Virtual stage, physics tuning, controls, formatting
   ├─ collision.js          Pure AABB collision, overlap, and platform parsing
   ├─ GameEngine.js         Fixed-step loop, player, camera, triggers, respawn, particles
   ├─ InputManager.js       Remappable keyboard and pointer-held touch actions
   ├─ levels.js             Twelve-level data campaign and defensive parser
   ├─ progress.js           Save schema, local persistence, 32 achievements
   ├─ Renderer.js           Canvas layers, procedural art, entities, weather, animation
   └─ rules.js              Pure checkpoint, trigger, bridge, unlock, and victory rules
```

React never receives player position, particles, platform state, or camera position. Those values change at frame rate inside `GameEngine`. React receives a small HUD snapshot at 10 Hz and discrete events such as `death`, `jump`, `secret`, `checkpoint`, and `levelVictory`. This keeps reconciliation out of the animation loop.

## Game loop and physics

`requestAnimationFrame` drives presentation. Elapsed display time is accumulated and simulated at a fixed 1/120-second step, capped after long frames so returning to a hidden tab cannot create a physics explosion.

Movement uses:

- Separate ground and air acceleration.
- Ground and air friction rather than instantaneous horizontal stops.
- Walk and run targets.
- 105 ms coyote time.
- 130 ms jump buffering.
- Variable jump height by applying stronger gravity after early jump release.
- A terminal fall-speed clamp.
- Direction-aware gravity so the same motion code works on floors and ceilings.

The tunable values live in `engine/constants.js`. Change them in small increments and replay the full campaign: jump speed, gravity, camera lead, platform spacing, and trap timing are coupled.

## Collision system

The player is an axis-aligned rectangle. Each physics step resolves horizontal movement before vertical movement. Solid platforms stop movement on both axes; one-way platforms only resolve when the previous player edge was on the permitted side. In reverse gravity, the underside of a ceiling becomes the landing face.

`collision.js` is side-effect-light and covered directly by Node tests. Runtime platform flags decide whether a surface currently participates: collapsing bridges set `active` and `solid` to false, while shy platforms keep collision geometry synchronized with their drawn position.

Hazards and triggers use rectangle overlap after movement. This makes their readable world geometry the source of truth. Falling spikes and boulders update their rectangles before the hazard pass, so rendering and collision cannot disagree.

## Camera

The side-scrolling camera follows a horizontal dead zone instead of pinning the player to screen centre. Player velocity supplies a bounded look-ahead, revealing more space in the direction of travel. The camera eases to its target and clamps to the level bounds. Reverse-gravity sections add a small vertical anticipation offset.

Shake is a decaying render offset. Reduced-shake mode makes that offset zero without changing physics or trap cues.

## Level system

Every level is plain data in `engine/levels.js`. `parseLevel` validates metadata, positive platform geometry, start position, and entity ID uniqueness. `loadLevel` returns a structured clone; deaths can reset mutable entity state without modifying campaign definitions.

A level supports these collections:

| Field | Purpose |
| --- | --- |
| `platforms` | Ground, stone, collapsing, bridge, jump-pad, shy, moving, ceiling, or one-way surfaces |
| `hazards` | Spikes, ceiling spikes, falling spikes, boulders, and future timed hazards |
| `triggers` | Rectangular cues that run a reusable action with optional target/value data |
| `enemies` | Stateful hazards such as the sleeper that wakes when ignored |
| `npcs`, `signs` | Proximity dialogue and foreshadowing |
| `collectibles` | Optional courage motes and collection statistics |
| `checkpoints` | Real or deliberately fake checkpoint banners |
| `goal`, `fakeGoals` | Honest completion and expectation traps |
| `secrets` | One optional hidden note per campaign level |
| `decorations` | Non-colliding storybook silhouettes |

### Create a level

1. Add a unique object to `levels` with a sequential `number`, unique `id`, title, subtitle, world `width`, player `start`, `mood`, and `weather`.
2. Build traversable geometry with `ground` and `p`. Use visible gaps and silhouette changes to foreshadow danger.
3. Give the level one primary rule and one readable exception. Reuse supporting mechanics only when they reinforce that lesson.
4. Add at least one real checkpoint, one goal, and one optional secret.
5. Add signs, composition, particles, or repeated motifs that make the trick deducible before it fires.
6. Run `npm test`; malformed geometry and duplicate IDs must fail parsing.
7. Play both slowly and at full run speed, then test from every checkpoint.

Level coordinates use the 1280 × 720 virtual stage. Ground begins at y=640. The player is 30 × 46. A running horizontal gap should generally stay below 180 pixels unless a jump pad, wind, moving platform, or gravity mechanic makes the route intentionally different.

## Add a hazard or trigger

For a new placement of an existing hazard, add a data record with `x`, `y`, `w`, `h`, `type`, and `active`. Dormant moving hazards also use `dormant: true` and a unique `id`; an `activateHazard` trigger names that ID through `target`.

For a new hazard family:

1. Add its time evolution to `GameEngine.updateHazards`.
2. Draw the same runtime rectangle or shape in `Renderer.drawEntities`.
3. Keep collision readable from the drawn silhouette.
4. Add a pure rule to `rules.js` if activation has branching logic.
5. Add automated tests for the rule and play tests at low and high frame rates.

Reusable trigger actions currently include `activateHazard`, `breakBridgeIfRunning`, `wind`, `gravity`, `reverseControls`, `fakeCheckpoint`, `fakeExit`, and `wrongWay`. Prefer a reusable action plus level parameters over a level-number conditional in the engine.

## Add an enemy

Add its data to `enemies`, update state in `GameEngine.updateEnemies`, and render it from the runtime `world.enemies` collection. Enemy behavior should expose a stable observation rule. Keep navigation deliberately simple: enemies are traps with personality, not a second physics engine.

## Checkpoints and respawn

`activateCheckpoint` rejects fake or already-used checkpoints and produces a stable player respawn point. A death immediately hides the player, emits particles and audio, and starts a 580 ms timer. Respawn reloads a fresh runtime clone, restores the active checkpoint and cumulative level statistics, and clears transient wind, gravity, input reversal, triggers, enemies, and collapsing geometry. No network, route transition, asset load, or React remount is required.

## Save and statistics

`progress.js` defines the complete versioned schema under `priit-deceptive-trial-v1`. It stores:

- Current and furthest unlocked level.
- Completed level IDs and fastest clears.
- Campaign best total time.
- Deaths, jumps, playtime, run time, collectibles, signs read, and secrets.
- Achievement IDs.
- Audio, comfort, colour, and remapped control settings.

`parseSave` treats corrupt JSON, arrays, missing collections, malformed nested settings, unavailable storage, and quota/security errors as recoverable. Defaults are merged field by field. Saves remain local to the current browser profile; there is no account, analytics, upload, or leaderboard.

## Achievement system

The 32 definitions have stable IDs and presentation copy. `evaluateAchievements` receives persistent statistics plus a small context for transient conditions such as clearing without a death, finding the developer room, entering a fake exit, or remaining airborne for two seconds. It returns a de-duplicated ID collection; `DeceptiveTrial.jsx` compares the previous collection and shows the first new toast.

To add an achievement:

1. Add a unique `[id, title, description]` tuple to `achievements`.
2. Add a deterministic condition to `evaluateAchievements`.
3. Emit persistent data or a discrete context flag from the relevant engine event.
4. Extend `tests/deceptive-trial.test.mjs` with the unlocking and non-unlocking cases.

Never change an existing ID after release; the ID is the save-game contract.

## Audio and animation

All sounds are synthesized at runtime. Short oscillator envelopes create jump, land, death, checkpoint, secret, collect, UI, and victory cues. Three low-volume filtered oscillators create mood-specific ambient harmony. The graph is initialized lazily, resumed from a user gesture, updated from volume settings, and disconnected on route exit.

Player stride, cloak, landing squash, dust, weather, foliage, parallax hills, checkpoints, motes, hazards, intro cards, and victory effects are procedural. Reduced flashing shortens presentation transitions; `prefers-reduced-motion` removes interface animation; reduced shake removes only camera shake.

## Performance strategy

- The whole experiment is a route-level lazy chunk with no new npm dependency.
- A 1280 × 720 virtual stage decouples physics and art from device size.
- Canvas DPR is capped at 2.
- Physics uses mutable runtime objects and fixed steps; it does not allocate React state.
- HUD snapshots are limited to 10 Hz and statistics to 1 Hz.
- Particle count is capped at 220 and automatically reduced on low-core devices.
- The canvas clips off-screen drawing naturally; no DOM entity nodes are created.
- Audio uses a small persistent graph and short-lived envelopes.
- Timers, animation frames, keyboard listeners, audio nodes, and input state are removed on unmount.

## Accessibility and controls

Keyboard actions are remappable and stored locally. Default controls support arrows and WASD, Space/Up/W for jump, Shift for run, and Escape/P for pause. Form controls are excluded from global gameplay capture. Touch devices receive left, right, run, and jump buttons with pointer cancellation handling.

Settings include separate master/music/effects volumes, reduced shake, reduced flashing, and a colourblind-friendly high-contrast hazard palette. Menus use native buttons, labels, inputs, headings, dialog roles, and live regions. The fixed virtual view scales down to phones without horizontal scrolling.

## Design philosophy checklist

Before accepting a trap, ask:

- Was the underlying rule taught safely first?
- Is the exception visible, hinted by copy, or inferable from repeated visual language?
- Does death explain the mistake?
- Is the behavior deterministic?
- Does the nearest checkpoint make another attempt quick?
- Is this trick materially different from nearby tricks?
- Can a patient player succeed on the first attempt through observation?

If the answer to the last question is “no,” add a clue or redesign the trap.

## Known limitations

- Progress does not sync between browsers or devices.
- Canvas gameplay exposes a concise accessible description, but the spatial platforming itself requires vision; a non-spatial alternative mode is not included.
- Mobile fallback is playable, but small screens make precision sections harder than keyboard play.
- Generated ambient audio is intentionally restrained and is not a recorded soundtrack.
- Collision is axis-aligned; rotating visuals must keep readable rectangular collision geometry.
- The campaign has no remote leaderboard, replay files, cloud saves, gamepad mapping, or user-generated level editor.
- External Google font loading may fall back to Georgia and system monospace when offline; layout remains functional.

## Development commands

From the repository root:

```bash
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

Use `npx netlify dev` for the complete authenticated Lab route. The focused tests live in `tests/deceptive-trial.test.mjs`. Verify both `/lab` dashboard registration and the direct `/lab/deceptive-trial` route before release.
