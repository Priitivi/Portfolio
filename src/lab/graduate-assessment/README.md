# Graduate Assessment Lab

Graduate Assessment Lab is a local-first practice platform inside Priit Lab. It trains the reasoning, judgement and interview skills commonly measured during graduate recruitment without copying any provider interface, question bank, scoring model, brand or proprietary methodology.

The chamber route is `/lab/graduate-assessment`. It is registered as Experiment 008 and remains behind the shared Lab access gate. Product code, content, styles and storage are isolated in this directory or use the `ga-` namespace, apart from the route registration in `LabApp.jsx` and `experiments.js`.

## Architecture

```text
graduate-assessment/
├── GraduateAssessmentLab.jsx       # View history, persistence and achievement queue
├── graduate-assessment.css         # Namespaced responsive and reduced-motion styles
├── components/
│   ├── AssessmentHeader.jsx        # Chamber navigation
│   ├── Dashboard.jsx               # Readiness, heatmap, activity and recommendations
│   ├── Practice.jsx                # Setup, timed runner, feedback, results and review
│   ├── InterviewPractice.jsx       # Prep/answer timers, capture and transcript review
│   └── Analytics.jsx               # Category, topic and achievement reporting
├── data/
│   └── packs.js                    # Pack registry and original authored content
├── engine/
│   ├── questions.js                # Seeded generators, validation and session assembly
│   ├── progress.js                 # Schema migration, analytics and adaptivity
│   ├── interview.js                # Transparent transcript-feedback heuristic
│   └── speech.js                   # Browser speech-recognition controller
└── hooks/
    └── useSpeechInput.js           # React adapter for the speech controller
```

The boundaries are deliberate:

1. Content records contain no React or browser code.
2. Engines are deterministic or dependency-injected and can run in Node tests.
3. React components consume a shared question contract and report neutral results.
4. The shell alone owns local persistence and cross-tab synchronisation.

Top-level views use URL hashes (`#dashboard`, `#practice`, `#interview`, `#analytics`), so browser Back and Forward restore the visible section. Company-specific packs can therefore reuse the runner and analytics without changing either.

## Reasoning practice

Sessions follow this state machine:

```text
setup → timed question → immediate rationale → results → review
```

`createPracticeSession()` accepts a category, exact difficulty, length, seed and pack. Foundation, Standard and Advanced select separate item pools; they are not silently mixed. `availableQuestionCounts()` lets the UI offer only valid session lengths.

Numerical questions are generated from eight topic factories. Each generated record contains raw audit values and an operation kind. `recalculateNumericalAnswer()` independently recomputes the key, while `validateNumericalQuestion()` verifies finite values, display formatting, unique options, answer bounds and probability bounds. Seeded generation makes failures reproducible.

Verbal, logical and situational questions are selected from authored datasets. Verbal sessions avoid duplicate passages. Logical tiles are serialisable shape descriptors rendered as accessible inline SVG; `describePattern()` produces equivalent screen-reader text. Situational items use a unique strongest modelled response plus three credible alternatives scored 3, 2 and 1. Review language describes trade-offs and model alignment rather than claiming that workplace judgement is universally right or wrong.

Each completed reasoning answer records only its stable ID, topic, choice, correctness and elapsed seconds. No question text is persisted.

## Interview practice

Interview practice follows:

```text
setup → preparation notes → timed transcript capture → transparent feedback
```

Preparation notes and the answer transcript are separate fields. Only the transcript is analysed. Deadline-based timers tolerate ordinary browser throttling, and recently used prompt IDs are excluded when selecting the next question.

Typing is always available. When `SpeechRecognition` or `webkitSpeechRecognition` exists, the browser can append final recognition results to the text area. Unsupported browsers, permission denial, missing microphones, network errors and unexpected recognition stops all retain the typed fallback. The Lab neither records audio nor uploads transcripts.

`analyseInterviewAnswer()` is an editing heuristic, not a hiring score. It reports visible text evidence for clarity, organisation, STAR-related signals, specificity and completeness. The review explicitly separates measured observations, heuristic suggestions and unavailable qualities. Speaking delivery, emotion, confidence, pronunciation and body language are not inferred.

## Progress schema and adaptivity

Progress uses payload schema version 2 under the stable local-storage key `priit-lab:graduate-assessment:v1`. Keeping the key stable allows version-1 data to migrate in place. Unknown future versions recover safely to a clean state.

The payload stores:

- aggregate reasoning attempts, correctness, response time and session count;
- category aggregates, with interview transcript scores kept distinct from reasoning accuracy;
- topic aggregates plus the latest 20 evidence points per topic;
- daily practice counts, streaks and recent activity;
- achievement IDs, interview count and a bounded list of completed session IDs.

Session IDs make recording idempotent, including under React Strict Mode or duplicate event delivery. Load-time sanitisation clamps numeric fields, removes unknown categories and achievements, validates dates, deduplicates activity and bounds retained arrays. Storage failures leave the current session usable, but progress becomes temporary.

Topic mastery combines accuracy, response pace, evidence volume and recent trend. Recommendations first create missing category baselines, then prioritise limited evidence, low mastery or strong-but-slow topics. Readiness remains “Not assessed yet” until one completed reasoning or interview session has produced category evidence; progress is only recorded on completion, so this is the first shared meaningful-evidence boundary across all modes. After that threshold, the estimate combines evidence volume, breadth and quality and applies its bounded minimum, deliberately resisting overconfidence from limited evidence. It is educational and explicitly non-validated; it is not a prediction of hiring outcomes.

## Adding a question pack

A pack has this shape:

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
    interview: { items: technologyInterviewItems },
  },
};
```

Add it to `questionPacks` in `data/packs.js`, then expose pack selection in the setup UI. The runner, storage schema and analytics need no structural change because `createPracticeSession()` already accepts a pack.

### Authored item contracts

Verbal:

```js
{
  id: "unique-id",
  difficulty: "foundation" | "standard" | "advanced",
  topic: "scope",
  passage: "Original self-contained passage…",
  statement: "Evidence claim…",
  answer: 0 | 1 | 2, // True, False, Cannot Say
  explanation: "Why the passage supports this classification."
}
```

Logical:

```js
{
  id: "unique-id",
  difficulty: "standard",
  topic: "dual-rule",
  prompt: "Which tile continues the sequence?",
  sequence: [{ shape: "triangle", rotation: 0, filled: true, count: 1 }],
  options: [/* four distinct tile descriptors */],
  answer: 0,
  explanation: "State every rule and apply it to the missing tile."
}
```

Supported shapes are `circle`, `square`, `diamond` and `triangle`. Do not make colour the sole carrier of a rule. Shape, position, fill, count or rotation must make each state understandable.

Situational judgement:

```js
{
  id: "unique-id",
  difficulty: "advanced",
  topic: "commercial-awareness",
  competency: "Commercial awareness",
  scenario: "Original workplace situation…",
  prompt: "Which response is strongest?",
  options: [
    { text: "Response…", score: 4, rationale: "Stakeholder and impact reasoning…" },
    // three plausible responses scored 3, 2 and 1
  ]
}
```

Use credible trade-offs. The strongest response should be proportionate, transparent and actionable, not merely the longest or most senior-sounding. Every option needs a specific educational rationale.

Interview:

```js
{
  id: "unique-id",
  competency: "Ownership",
  difficulty: "standard",
  question: "Original behavioural question…",
  probes: ["Planning cue", "Evidence cue"]
}
```

Probes are retrieval prompts, not model answers.

### Extending numerical generation

To add a numerical topic:

1. add its ID to `numericalTopics`;
2. implement difficulty-specific operations in its factory;
3. return a prompt, four unique formatted options, an answer index, explanation, operation kind and raw audit values;
4. register the factory in `numericalFactories`;
5. extend independent recalculation and property tests.

Calculate the correct raw value before formatting. Preserve units and sign placement, keep probabilities in 0–100%, and make distractors represent distinct plausible errors.

## Content standards

- Author every passage, chart context, scenario and prompt specifically for this Lab.
- Never transcribe or lightly rewrite commercial-provider material.
- Avoid provider branding, navigation patterns and proprietary scoring language.
- Avoid cultural trivia, obscure vocabulary and unstated industry knowledge.
- Make verbal classifications decidable from the passage alone.
- Give every item a stable pack-unique ID, difficulty and analytics topic.
- Use neutral fictional organisations and time-stable facts.
- Add automated contract tests and a human ambiguity review for each new pack.

## Accessibility and performance

The interface is keyboard-operable, mobile-first and uses native controls, labels, text areas and table semantics. Interactive targets are at least 44 CSS pixels. Focus uses a visible yellow outline and the skip link becomes visible on focus. Timers announce only meaningful thresholds rather than every second. Logical graphics have descriptive accessible names. Colour is reinforced with text, symbols and borders.

At narrow widths, analytics rows become labelled cards instead of requiring horizontal page scrolling; visual sequences retain a deliberate contained horizontal scroller. `prefers-reduced-motion` collapses animation and transition durations. There are no external fonts, images, scoring APIs or analytics dependencies, and the route stays lazy-loaded from the Lab shell.

## Validation

Two Node suites cover the feature:

- `tests/graduate-assessment.test.mjs`: route isolation, pack contracts, deterministic sessions, persistence, achievements, adaptivity, responsive hooks and reduced motion.
- `tests/graduate-assessment-qa.test.mjs`: thousands of generated numerical questions with independent answer recalculation, repeated-session duplicate checks, exact difficulty pools, content integrity, speech fallbacks, timer helpers, migration sanitisation, idempotency, DST-safe streaks, mastery trends and readiness confidence.

Before release, run:

```text
npm test
npm run lint
npm run build
git diff --check
```

Manual QA should still review content ambiguity, judgement trade-offs, screen-reader phrasing, speech recognition in each supported browser and representative real devices.
