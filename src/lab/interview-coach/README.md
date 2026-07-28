# Interview Coach Lab

Interview Coach is a protected, deterministic interview-preparation workspace at:

```text
/lab/interview-coach
```

It is designed for final-stage Digital Learning Designer practice, with particular emphasis on discovery, stakeholder communication, customer learning design and the Smart Rebook Product Owner role-play.

## Features

- Preparation dashboard covering role competencies, strong evidence, relevant CV examples and preparation areas
- Smart Rebook discovery checklist
- One-question-at-a-time mock interview with deterministic follow-ups
- Ten-minute Product Owner role-play with pause, resume and restart controls
- Intent and keyword-driven Product Owner responses
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

- `data/competencies.js` contains role areas explicitly described in the supplied interview brief and labels suggested preparation questions as `practice-prompt`.
- `data/candidateEvidence.js` contains a redacted, role-relevant evidence set from the supplied CV summary and labels each entry `source-backed-cv`.
- `data/mockQuestions.js` contains a curated question tree grounded in the described role responsibilities.
- `data/smartRebookScenario.js` keeps `confirmed-source-fact` entries completely separate from `fictional-exercise-assumption` entries.

The original PDFs are not included in `src`, `public` or the production bundle. In the desktop implementation environment, the two PDF paths named in the brief were not mounted; the checked-in source-backed data is therefore limited to the detailed source excerpts included in that brief and should be reconciled against the full documents when they are available.

Do not add contact details or unnecessary personal identifiers when updating the evidence bank.

## Privacy model

- Answers, notes, timer state and feedback use the namespaced `sessionStorage` key `priit:lab:interview-coach:v1`.
- Clear session removes that key and resets the in-memory state.
- No answer is logged, uploaded, analysed by an external AI service or sent to analytics.
- The deterministic response and scoring systems run entirely in the browser.
- Original source documents are not shipped with the frontend.

## Core maintenance files

```text
interview-coach/
├── components/
├── data/
│   ├── candidateEvidence.js
│   ├── competencies.js
│   ├── mockQuestions.js
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

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

The Interview Coach tests cover protected route integration, question progression, controlled role-play matching, timer expiry, heuristic scoring, session reset and provenance separation.
