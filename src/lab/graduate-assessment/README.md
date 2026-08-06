# Graduate Assessment Lab

Graduate Assessment Lab is a local-first practice platform inside Priit Lab. It develops reasoning, workplace judgement, and interview skills used in graduate recruitment without reproducing a provider interface, question bank, scoring model, brand, or proprietary methodology.

The authenticated route is `/lab/graduate-assessment`. It is registered as Experiment 008 and is lazy-loaded through the established Lab shell. Feature code, content, styles, progress, and transient simulation state are isolated in this directory or use the `ga-` namespace.

All scores are educational signals. Readiness is an unvalidated practice estimate, situational rankings are authored educational models, and interview feedback is a transparent text heuristic. The Lab is not affiliated with an assessment provider.

## Architecture

```text
graduate-assessment/
|-- GraduateAssessmentLab.jsx       # View history, persistence, cross-tab sync, unlock queue
|-- graduate-assessment.css         # Namespaced responsive and reduced-motion styles
|-- components/
|   |-- AssessmentHeader.jsx        # Lab navigation
|   |-- Dashboard.jsx               # Readiness, heatmap, activity, recommendations
|   |-- Practice.jsx                # Setup, adjustable-pace practice, feedback, review
|   |-- Simulation.jsx              # Multi-section assessments, checkpointing, end review
|   |-- InterviewPractice.jsx       # Prep/answer timers, capture, transcript review
|   |-- AnswerExplanation.jsx       # Model reasoning and selected-answer misconception
|   |-- ReviewNavigator.jsx         # Accessible correct/review/timeout answer map
|   |-- QuestionContent.jsx         # Shared tables, charts, passages, and SVG patterns
|   `-- Analytics.jsx               # Evidence, mastery, trends, and practice history
|-- data/
|   |-- catalog.js                  # Lightweight category and numerical-topic metadata
|   |-- packs.js                    # Core pack registry and original base content
|   `-- content-expansion.js        # Expanded authored verbal, logical, SJT, interview content
|-- engine/
|   |-- questions.js                # Seeded assembly, selection, base numerical factories
|   |-- numerical-expansion.js      # Second numerical template family
|   |-- simulation.js               # Format definitions, assembly, answer, and result engine
|   |-- checkpoint.js               # Lightweight transient simulation validation and recovery
|   |-- content-validation.js       # Pack inventory and authored-content contracts
|   |-- learning.js                 # Formative topic, method, and pace feedback
|   |-- progress.js                 # Schema migration, analytics, adaptivity, exposure memory
|   |-- presentation.js             # Shared session labels and relative-date copy
|   |-- timing.js                   # Shared standard, +50%, and untimed pace profiles
|   |-- interview.js                # Transparent transcript-feedback heuristic
|   `-- speech.js                   # Browser speech-recognition controller
`-- hooks/
    `-- useSpeechInput.js            # React adapter for speech recognition
```

The boundaries are deliberate:

1. Content records contain no React or browser code.
2. Engines are deterministic or dependency-injected and can run in Node tests.
3. Practice and simulation share one normalised question contract and renderer.
4. Runners report neutral completion records; the shell owns persistence.
5. Content validation is separate from runtime selection, so new packs can be audited before use.

Top-level views use URL hashes (`#dashboard`, `#practice`, `#simulation`, `#interview`, `#analytics`). Browser Back and Forward therefore restore the visible section without introducing a second router. Dashboard code loads with the route; Practice, Simulation, Interview, and Analytics are separate lazy chunks. The lightweight catalog keeps dashboard and progress calculations independent from the full authored question bank.

## Product design principles

The interface applies a small set of learning-product patterns without copying another product's layout, language, points economy, or visual system:

- one achievable daily objective makes the next action concrete without punishing a missed day;
- skill evidence and milestones show progress while keeping low-evidence estimates honest;
- recommendations launch the exact topic, difficulty, pace, and session length they describe;
- immediate feedback is reserved for formative practice, while simulations preserve end-only review;
- review separates the model method from the learner's selected misconception;
- retrieval prompts revisit evidenced topics on a transparent cadence instead of claiming calibrated memory prediction.

Daily objectives, evidence labels, next milestones, and recommendations are derived from the existing local progress record. They introduce no new persistence fields or reward currency.

## Content inventory

The core pack currently contains:

| Mode | Inventory | Difficulty balance |
| --- | ---: | --- |
| Numerical | 48 operation templates | 16 per difficulty; 6 per topic across Foundation, Standard, and Advanced |
| Verbal | 42 questions across 22 passages | 14 per difficulty |
| Logical | 30 visual sequences | 10 per difficulty |
| Situational judgement | 30 scenarios | 10 per difficulty |
| Interview | 75 prompts | 26 Foundation, 25 Standard, 24 Advanced |

Numerical coverage includes percentages, ratios, currency conversion, tables, charts, profit/loss, averages, and probability. The two implementation modules provide two operation kinds for every topic/difficulty pair.

The authored datasets are original. Verbal passages are self-contained; logical rules use serialisable shape descriptors; SJT options contain complete rationales and ranked trade-offs; interview prompts include retrieval probes, a preparation cue, a recommended response structure, and follow-up questions.

## Deterministic question generation and selection

`createPracticeSession()` accepts a category, exact difficulty, length, seed, pack, and optional selection context. The same inputs produce the same ordered questions. Seeded generation makes content failures and simulations reproducible.

Focused numerical selection:

1. honours an explicit recommendation topic when the learner accepts one;
2. prioritises unanswered numerical topics;
3. then prioritises topics with weaker mastery;
4. avoids recently exposed operation template IDs where alternatives exist;
5. avoids duplicate templates within the current session where possible;
6. falls back deterministically when the requested pool is exhausted.

Authored selection ranks stable items using the seed and then favours unseen question and passage IDs, weak topics, and unanswered topics. Verbal sessions avoid repeated passages. The strategy is freshness-aware, not random-only: local exposure memory guides the next session while deterministic tie-breaking keeps it testable.

Every generated numerical question contains raw audit values and an operation kind. `recalculateNumericalAnswer()` independently recomputes its key. `validateNumericalQuestion()` checks finite values, answer bounds, unique options, display formatting, and probability bounds.

## Focused practice

Focused sessions follow:

```text
setup -> question -> immediate rationale and learning signal -> results -> review
```

Foundation, Standard, and Advanced use distinct item pools and standard pace targets. Difficulty controls content complexity; it does not silently control whether the learner receives a time accommodation. The separate pace profile offers Assessment pace, +50% Extended pace, and Untimed learning. This lets a learner rehearse a method before introducing speed without changing the question pool or interpreting untimed work as on-pace performance.

`availableQuestionCounts()` exposes only valid lengths. Practice records stable IDs, topics, choices, correctness, elapsed seconds, the optional pace profile, and relevant passage/template IDs; it never persists question or passage text. After each answer, `learningSignal()` pairs the authored rationale with a topic-specific strategy, an honest pace comparison when applicable, and one next action. `answerReview()` adds category-specific guidance about why the learner's selected option missed the model answer. These are formative prompts, not ability classifications. Results and review expose the same numbered status map, with text labels for correct, review, and timeout states.

Situational practice identifies the strongest authored model response but explains every option. Copy deliberately describes trade-offs and model alignment rather than universal workplace truth.

## Assessment simulations

Simulations suppress feedback until submission and use three explicit formats:

| Format | Composition | Timing |
| --- | --- | ---: |
| Quick simulation | 12 mixed Standard questions: 4 numerical, 4 verbal, 4 logical | 12 minutes |
| Standard graduate simulation | 9 numerical, 9 verbal, 9 logical in separate sections | 27 minutes |
| Full practice assessment | 8 numerical, 8 verbal, 8 logical, plus optional 8 SJT | 27 or 38 minutes |

Standard sections use a 2 Foundation / 4 Standard / 3 Advanced mix. Full sections use a 2 / 3 / 3 mix. A seeded assembler prevents duplicate question IDs across the full run and extends the exposure context as each allocation is built.

Every format supports the same explicit pace profiles as focused practice. Standard preserves the timings above, Extended adds 50% to each section, and Untimed removes automatic section expiry. The setup shows a preflight checklist before launch. Content and scoring remain identical across pace profiles, so changing a practice accommodation never changes difficulty or the answer key.

Section deadlines are absolute timestamps rather than interval counters. Reloading or returning after browser throttling recalculates remaining time from the deadline. When a section expires, all its unanswered questions are recorded as timed out before the next section begins. Results include overall and per-section accuracy, response time, and answer review; they do not claim percentiles, employer pass marks, or psychometric validity.

Live simulations use a separate transient checkpoint key:

```text
priit-lab:graduate-assessment:simulation:v1
```

`createSimulationCheckpoint()` stores the assembled question descriptors, current section/question indices, answers, and section deadline. `loadSimulationCheckpoint()` validates the checkpoint version and bounds before resuming. Completion removes the checkpoint and writes only the normal progress summary. This separation prevents an interrupted run from corrupting durable progress.

## Interview practice

Interview practice follows:

```text
setup -> preparation notes -> transcript capture -> transparent feedback
```

Preparation notes and the answer transcript are separate. Only the transcript is analysed. The review places the private preparation plan beside the submitted transcript so the learner can compare intention with execution. Recently exposed prompt IDs are excluded where possible.

Preparation and answer windows are adjustable, and an Untimed rehearsal option advances each phase manually. Typing is always available. If `SpeechRecognition` or `webkitSpeechRecognition` exists, the browser can append final recognition results. Unsupported browsers, permission denial, missing microphones, network errors, and recognition stops retain the typed fallback. The Lab neither records audio nor uploads transcripts.

`analyseInterviewAnswer()` is a text-editing heuristic, not a hiring score. It checks observable signals for clarity, organisation, STAR-related structure, specificity, and completeness. It does not infer speaking delivery, emotion, confidence, pronunciation, body language, suitability, or employer outcomes.

## Progress, migration, and local persistence

Durable progress uses schema version 3 under the unchanged local-storage key:

```text
priit-lab:graduate-assessment:v1
```

The key remains unchanged so existing version-1 and version-2 payloads migrate in place. `loadProgress()` accepts versions 1, 2, and 3, sanitises them into the current shape, and safely resets unknown future or malformed payloads. No authenticated-user or server-global progress store is used: progress belongs to that browser profile and origin.

Version 3 adds:

- aggregates by practice mode (`practice`, `simulation`, `interview`);
- aggregates by difficulty;
- bounded recent exposure lists for question, passage, and numerical-template IDs;
- mixed simulation activity summaries.

Pace profiles and topic completion timestamps are optional additive fields inside version 3. Older version-3 payloads therefore remain valid without a schema bump. When an older topic sample lacks its own timestamp, spacing logic uses the latest matching session timestamp (then the original progress creation date) rather than treating the sample as newly completed.

Existing totals, category/topic evidence, streaks, achievements, readiness evidence, and interview counters/activity remain compatible. Earlier payloads receive empty difficulty/exposure fields and conservative mode aggregates derived from existing category/totals data. Session IDs keep recording idempotent under duplicate delivery or React Strict Mode.

Retained exposure is intentionally bounded to 160 question IDs, 80 passage IDs, and 80 template IDs. These are stable identifiers only, not authored question text or interview transcripts.

## Analytics, mastery, and readiness

Analytics report category accuracy/model alignment, average response time, topic mastery, evidence strength, mode performance, difficulty exposure, supported strengths, weakest opportunities, recent-session trend, and local practice history. Internal exposure memory continues to improve question selection but is not presented as a learner-facing performance measure.

Topic mastery combines:

- recent and lifetime accuracy;
- pace relative to the difficulty target;
- evidence volume, capped at ten attempts for confidence;
- a six-answer recent trend when available.

Mastery begins at a neutral 50 and moves toward observed performance as evidence grows. Recommendations first fill missing category baselines, then use due retrieval checks, weak or limited-evidence topics, pace, and breadth.

Each recommendation is an executable practice intent containing category, exact difficulty, pace profile, question count, and an optional topic focus. The Practice view displays that focus and passes it into the deterministic selector. Changing category manually clears an incompatible focus rather than silently applying it elsewhere.

Evidence strength is a descriptive label based on completed sessions, reasoning/interview samples, and category breadth. Supported strengths require at least three attempts in a topic. Opportunity labels distinguish accuracy from pace, so an accurate learner is not told to relearn a method solely because responses are slow. The dashboard's ten-item daily objective and next-achievement progress are presentation-time derivations and never modify the saved schema.

`spacedReviewQueue()` uses a deliberately simple educational cadence: topics below 60 mastery return after two days, topics from 60-74 after four days, and topics at 75 or above after seven days. It uses the same locally stored topic timestamps and does not add background jobs or notifications. The intervals are retrieval prompts, not a calibrated forgetting-curve or memory prediction.

Readiness remains `Not assessed yet` until one completed reasoning, simulation, or interview session has produced meaningful category evidence. `MIN_READINESS_SESSIONS = 1` documents this explicit threshold: completion is the first point at which a runner has produced reviewable evidence, whereas merely opening or abandoning a session is not evidence. The existing minimum readiness floor applies only after the threshold. Once assessed, the estimate combines evidence volume, category breadth, and observed quality. It is an educational practice estimate, not a scientifically validated prediction.

## Authored content and validation contracts

`validateContentPack()` checks the complete assembled pack. It reports duplicate IDs, invalid difficulties, duplicate verbal passage IDs with conflicting text, underspecified passages/prompts/responses, missing or invalid answers, weak explanations, indistinguishable logical options, incomplete SJT ranks/rationales, missing interview coaching metadata, provider branding, minimum pool sizes, and excessive difficulty imbalance. `contentInventory()` supplies stable counts for tests and review reports.

Minimum record shapes are:

```js
// Verbal
{
  id: "unique-id",
  passageId: "stable-passage-id",
  difficulty: "foundation" | "standard" | "advanced",
  topic: "scope",
  passage: "Original self-contained passage...",
  statement: "Evidence claim...",
  answer: 0 | 1 | 2, // True, False, Cannot say
  explanation: "Why the passage supports this classification."
}

// Logical
{
  id: "unique-id",
  difficulty: "standard",
  topic: "dual-rule",
  prompt: "Which tile continues the sequence?",
  sequence: [{ shape: "triangle", rotation: 0, filled: true, count: 1 }],
  options: [/* four visually and accessibly distinct descriptors */],
  answer: 0,
  explanation: "State each rule and apply it to the missing tile."
}

// Situational judgement
{
  id: "unique-id",
  difficulty: "advanced",
  topic: "commercial-awareness",
  competency: "Commercial awareness",
  scenario: "Original workplace situation...",
  prompt: "Which response is strongest?",
  options: [
    { text: "Response...", score: 4, rationale: "Stakeholder and impact reasoning..." }
    // plus distinct responses scored 3, 2, and 1
  ]
}

// Interview
{
  id: "unique-id",
  competency: "Ownership",
  difficulty: "standard",
  question: "Original behavioural question...",
  probes: ["Retrieval cue", "Evidence cue"],
  preparationCue: "Short planning prompt...",
  recommendedStructure: "Context, personal action, outcome and reflection",
  followUps: ["Original follow-up question..."]
}
```

Logical shapes are `circle`, `square`, `diamond`, and `triangle`. Do not use colour as the sole carrier of a rule. SJT trade-offs must be credible and specific; the strongest response should be proportionate, transparent, and actionable, not merely long or senior-sounding.

## Adding company or sector packs

A pack reuses the same engine contract:

```js
export const technologyPack = {
  id: "technology-core",
  name: "Technology Core",
  version: 1,
  description: "Original technology-sector contexts.",
  categories: {
    numerical: { topics: ["percentages", "tables", "probability"] },
    verbal: { items: technologyVerbalItems },
    logical: { items: technologyLogicalItems },
    situational: { items: technologySjtItems },
    interview: { items: technologyInterviewItems }
  }
};
```

To add one:

1. author a separate module with stable, pack-unique IDs and original content;
2. register it in `questionPacks` in `data/packs.js`;
3. run `validateContentPack()` and add exact inventory/balance assertions;
4. expose pack selection in the appropriate setup UI;
5. exercise focused and simulation assembly across multiple seeds;
6. perform a human ambiguity, cultural-bias, and SJT trade-off review.

The runner, persistence schema, analytics, and simulation engine accept normalised records, so company-specific context does not require structural refactoring.

For a new numerical operation, calculate the raw key before display formatting, add independent recalculation, provide distinct plausible distractors, register the factory, and extend property tests. Preserve units/signs and keep probability results within 0-100%.

## Accessibility and performance

The UI is keyboard-operable and mobile-first. It uses native controls, labelled answer groups, text areas, tables, accessible inline SVG, `aria-pressed` for option groups, `aria-current` for Lab navigation, a polite route announcement, and named progress bars. Interactive targets are at least 44 CSS pixels. Focus has a visible yellow outline; question, review, preparation, response, and interview-review transitions hand focus to the new task context. Timers announce only meaningful 60-second, 15-second, and expiry thresholds; untimed modes provide a textual pace status instead of a fake clock. Review status never relies on colour alone.

Narrow analytics rows become labelled cards; visual sequences and review maps use contained horizontal scrollers. `prefers-reduced-motion` reduces animations, transitions, and loading indicators. There are no external fonts, images, scoring APIs, or analytics dependencies. The route and its secondary views are lazy-loaded, while shared metadata lives in the small catalog module so opening the dashboard does not evaluate the full content bank.

## Tests and release validation

The feature suites are:

- `tests/graduate-assessment.test.mjs`: route isolation, pack contracts, deterministic sessions, persistence, achievements, adaptivity, responsive hooks, and reduced motion.
- `tests/graduate-assessment-qa.test.mjs`: 4,800 independently recalculated numerical generations, duplicate checks, exact difficulty pools, content integrity, speech fallbacks, timer helpers, migration sanitisation, idempotency, streaks, mastery trends, spacing, timing-profile persistence, readiness confidence, derived daily/milestone states, recommendation intents, and answer-review misconceptions.
- `tests/graduate-assessment-simulation.test.mjs`: expanded inventory/balance, multi-seed deterministic simulation assembly, duplicate protection, checkpoint recovery across every pace profile, formative learning signals, result aggregation, v1/v2/v3 migration, exposure-aware and explicit-focus selection, and UI accessibility/lazy-loading contracts.

Run targeted suites with:

```text
node --test tests/graduate-assessment.test.mjs tests/graduate-assessment-qa.test.mjs tests/graduate-assessment-simulation.test.mjs
```

Run the authoritative project checks before release:

```text
npm test
npm run lint
npm run build
git diff --check
```

Automated validation cannot replace human review. Before release, manually inspect content ambiguity and fairness, SJT trade-offs, screen-reader phrasing, speech recognition across supported browsers, timer behaviour under real tab suspension, and representative touch devices.
