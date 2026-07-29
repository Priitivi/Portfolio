# Interview Coach Lab

Interview Coach is a protected, deterministic interview-preparation workspace at:

```text
/lab/interview-coach
```

It is designed for final-stage Digital Learning Designer practice, with particular emphasis on discovery, stakeholder communication, customer learning design and the Smart Rebook Product Owner role-play.

## Features

- Preparation dashboard covering role competencies, strong evidence, relevant CV examples and preparation areas
- Smart Rebook discovery checklist
- One-question-at-a-time mock interview with answer-dimension follow-ups
- Ten-minute Product Owner role-play with pause, resume and restart controls
- Layered local intent classification with contextual follow-up resolution
- Progressive, source-referenced Product Owner responses with controlled variation
- Confidence-aware clarification for ambiguous or low-signal input
- Transparent heuristic feedback after either practice mode
- Retry, preparation and clear-session actions
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
- No answer is logged, uploaded, analysed by an external AI service or sent to analytics.
- The deterministic response and scoring systems run entirely in the browser.
- Conversation interpretation makes no network request and needs no external model, account, API key or subscription.
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

## Deterministic limitations

The engine can handle a sizeable authored range of paraphrases, spelling errors and local conversational references, but it does not understand unrestricted language. It cannot infer facts that are absent from the scenario, resolve every long-distance reference or judge whether an interview answer is substantively true. Low-confidence clarification is intentional: it is safer than inventing a fact or confidently selecting an unrelated topic.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

The Interview Coach tests cover protected route integration, a large natural-language evaluation fixture, the demonstrated role-elaboration regression, contextual references, multi-intent questions, progressive disclosure, safe fallbacks, source validation, mock follow-ups, transcript scoring, session migration/reset, responsive input behaviour and privacy boundaries.
