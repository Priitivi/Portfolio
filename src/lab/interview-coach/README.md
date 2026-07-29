# Interview Coach Lab

Interview Coach is a protected, deterministic interview-preparation workspace at:

```text
/lab/interview-coach
```

It is designed for final-stage Digital Learning Designer practice, with particular emphasis on discovery, stakeholder communication, customer learning design and the Smart Rebook Product Owner role-play.

## Features

- Preparation dashboard covering role competencies, strong evidence, relevant CV examples and preparation areas
- Smart Rebook discovery checklist
- One-question-at-a-time mock interview with a unique primary-question plan and separately tracked follow-ups
- Supportive, Realistic and Pressure practice modes that adjust probing without changing source content
- Optional browser speech recognition with interim text, editable final transcripts and manual submission
- Optional browser speech synthesis for interviewer questions and Duncan, with replay, pause, resume and stop
- Focused post-interview retries that preserve the original answer
- Private local notes shared across practice modes
- Ten-minute Product Owner role-play with pause, resume and restart controls
- Layered local intent classification with contextual follow-up resolution
- Progressive, source-referenced Product Owner responses with controlled variation
- Confidence-aware clarification for ambiguous or low-signal input
- Transparent heuristic feedback after either practice mode
- Whole-session retry, individual-answer retry, preparation and clear-session actions
- Keyboard focus states, semantic controls, reduced-motion support and responsive layouts

## Protected access

The route is registered in `src/lab/experiments.js`, so `LabApp` recognises it as a chamber. `LabApp` checks the existing Lab session before any chamber component is rendered.

Authentication is not implemented inside this Lab. It inherits the existing shared flow:

1. `LabGate` collects the shared clearance password.
2. `/lab/api/session` sends it to the existing Netlify Function.
3. The Function verifies it against `LAB_PASSWORD_HASH`.
4. A successful request receives the existing signed, short-lived, `HttpOnly`, `SameSite=Strict` Lab cookie.
5. `LabApp` lazy-loads `InterviewCoach` only after the session is authenticated.

No password or new secret is present in Interview Coach code.

As documented for the rest of the Lab, this client-side gate controls access to the route but is not a secrecy boundary for compiled JavaScript. The content model therefore contains only the minimum role-relevant material needed for practice and no contact details.

## Content and provenance

The implementation separates content by provenance:

- `data/competencies.js` contains role areas from the complete job description, labels suggested preparation questions as `practice-prompt`, and keeps the candidate's handwritten positioning notes separate as `candidate-preparation-note`.
- `data/candidateEvidence.js` contains a redacted, role-relevant evidence set from the complete CV and labels each entry `source-backed-cv`.
- `data/mockQuestions.js` contains a curated question tree grounded in the described role responsibilities.
- `data/smartRebookScenario.js` keeps `confirmed-source-fact` entries completely separate from `fictional-exercise-assumption` entries.

The content was reconciled against the complete interview pack, handwritten preparation notes, job description and CV on 28 July 2026. The original documents live only in the ignored local directory `docs/private-source/`. That directory is excluded by `.gitignore`, is not tracked by Git and is not copied into `src`, `public` or the production bundle.

Do not add contact details or unnecessary personal identifiers when updating the evidence bank.

## Privacy model

- Answers, notes, timer state and feedback use the namespaced `sessionStorage` key `priit:lab:interview-coach:v1`.
- Clear session removes that key and resets the in-memory state.
- Typed answers are not logged, uploaded, analysed by an external AI service or sent to analytics.
- The deterministic response and scoring systems run entirely in the browser.
- Conversation interpretation makes no network request and needs no external model, account, API key or subscription.
- Voice features use only the browser-standard `SpeechRecognition`/`webkitSpeechRecognition` and `speechSynthesis` interfaces. The application does not call or subscribe to a speech API. A browser may process microphone audio using its own vendor service, so voice remains optional and typing fully available.
- Speech recognition never auto-submits. The candidate reviews and may edit the final transcript before sending.
- Original source documents are not shipped with the frontend.
- `.gitignore` excludes `docs/private-source/` and temporary PDF renders under `tmp/pdfs/`.

## Core maintenance files

```text
interview-coach/
├── conversation/
│   ├── normaliseInput.js
│   ├── calculateIntentScore.js
│   ├── resolveContextualFollowUp.js
│   ├── detectAmbiguity.js
│   ├── classifyRoleplayTurn.js
│   ├── selectRoleplayResponse.js
│   └── analyseMockAnswer.js
├── components/
├── data/
│   ├── candidateEvidence.js
│   ├── competencies.js
│   ├── mockQuestions.js
│   ├── roleplayResponses.js
│   └── smartRebookScenario.js
├── hooks/
├── utils/
│   ├── questionProgression.js
│   ├── roleplayMatcher.js
│   ├── scoring.js
│   ├── sessionState.js
│   └── timer.js
├── InterviewCoach.jsx
└── interview-coach.css
```

Keep confirmed product behaviour out of the fictional assumptions array. New role-play detail that is not explicitly supported by the interview pack must be labelled `fictional-exercise-assumption`.

## Conversation engine

The role-play deliberately uses a controlled local language engine rather than an external AI service:

```text
Raw message
  → normalisation and light spelling correction
  → conversational-reference detection
  → weighted intent candidate scoring
  → context-aware reranking
  → confidence and ambiguity handling
  → progressive response selection
  → coverage and scoring metadata
```

Intent definitions contain examples, phrases, keywords, synonym groups, required signals, negative signals, question-word compatibility and priority. Classification combines those signals with phrase similarity, light stemming, one-edit fuzzy token matches, recent transcript topic, previous Duncan response, repeated-question penalties and multi-intent clause order.

The result is structured metadata containing the primary intent, secondary intents, confidence, whether context was used, whether clarification is needed and the signals that matched. Internal scores and signals are never displayed in the normal interface.

Contextual phrases such as “What does that involve?”, “Who would do that?” and “What happens next?” are resolved against recent turn metadata. If a pronoun has no reliable antecedent, Duncan asks a short clarification question instead of selecting a topic from a generic word.

Responses use three progressive detail levels. Selection is deterministic, avoids the immediately previous variant and does not reveal another topic merely to create novelty. Every authored Duncan response references at least one valid `confirmed-source-fact` or `fictional-exercise-assumption`; the response library validates those references when imported and in tests.

## Root cause of the original role bug

The original matcher normalised punctuation and then used `Array.find()` to return the first intent containing any configured substring. The first role entry grouped “introduce yourself”, “who are you”, “what is your role” and the broad phrase “your role” under one fixed introduction response.

Consequently, “Can you please elaborate on your role?” contained “your role”, immediately matched that first entry and returned “I’m Duncan, the Product Owner for Smart Rebook.” There was no competing-candidate score, negative signal, distinction between identity and responsibility, transcript context, confidence threshold or repetition handling.

The replacement separates identity, responsibilities, Smart Rebook involvement, day-to-day contribution, decision authority and stakeholder relationships into distinct intents. Broad role phrases no longer override a more specific request.

## Mock-interview heuristics

Mock answers are checked locally for a concrete example, situation, personal action, outcome, customer focus, learner focus, collaboration, blocker, reflection and measurable evidence. A maximum of one follow-up is selected for the most important missing dimension. A sufficiently complete answer moves on or uses a deeper authored competency follow-up rather than repeatedly demanding STAR wording.

Feedback uses the stored per-answer analysis and transcript coverage. Labels remain `Strong`, `Developing` and `Needs more evidence`, with an explicit statement that they are heuristic practice feedback rather than a hiring prediction.

### Question planning and practice pressure

Every new mock interview creates a session plan containing ordered primary question IDs and competency IDs. The session separately records all asked IDs, primary IDs and follow-up IDs. Primary IDs are deduplicated before the plan is created, and progression refuses to save the same queue item twice. The first eight primary questions therefore remain unique; follow-ups do not increment or replace that primary-question sequence.

The previous implementation relied only on a mutable queue and `currentIndex`. It had no asked-question ledger or explicit uniqueness invariant, and the old retry action rebuilt the whole queue from its first question. That made repetition possible when queue state was restored or extended and guaranteed unnecessary repetition when a candidate only wanted to improve one weak answer.

Supportive mode withholds a probe once an answer has a usable foundation. Realistic mode uses one targeted missing-dimension probe. Pressure practice uses a concise, more direct probe even when the answer is broadly complete. These modes never change IRIS or Duncan facts and never introduce invented interviewer behaviour.

### Browser speech controls

`utils/browserSpeech.js` isolates feature detection and small deterministic controllers for recognition and synthesis. React hooks own lifecycle cleanup and UI state. Both mock interview answers and role-play questions can be dictated in `en-GB`; interim words remain visibly separate until the browser marks a result final, then the final transcript is appended to the editable textarea.

Submission always remains a distinct candidate action. Speech synthesis is also user-gated: it does not speak on first load or after restoring a saved setting. Replay is always manual, and automatic reading of the next interviewer or Duncan response starts only after a user interaction has unlocked playback.

### Focused retry

The feedback report identifies answer-level missing signals and offers an individual retry. Starting one creates a one-question retry state, shows the preserved original answer and stores the improved attempt as a separate record linked to the original primary question. Scoring uses the latest retry for practice feedback without deleting or overwriting the original answer.

## Deterministic limitations

The engine can handle a sizeable authored range of paraphrases, spelling errors and local conversational references, but it does not understand unrestricted language. It cannot infer facts that are absent from the scenario, resolve every long-distance reference or judge whether an interview answer is substantively true. Low-confidence clarification is intentional: it is safer than inventing a fact or confidently selecting an unrelated topic.

Speech recognition quality, permission prompts, supported languages and whether audio is processed on-device or by a browser vendor vary by browser and operating system. The simulator cannot control those implementation details. Unsupported or denied speech features always fall back to the editable text workflow.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

The Interview Coach tests cover protected route integration, a large natural-language evaluation fixture, the demonstrated role-elaboration regression, contextual references, multi-intent questions, progressive disclosure, safe fallbacks, source validation, unique eight-question plans, difficulty probing, focused retry, browser speech recognition/synthesis fakes, microphone permission denial, unsupported-browser fallback, transcript scoring, session migration/reset, responsive input behaviour and privacy boundaries.
