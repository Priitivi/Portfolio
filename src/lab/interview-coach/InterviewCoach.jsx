import { useCallback, useEffect } from "react";
import CoachHeader from "./components/CoachHeader.jsx";
import FeedbackScreen from "./components/FeedbackScreen.jsx";
import MockInterviewScreen from "./components/MockInterviewScreen.jsx";
import PreparationScreen from "./components/PreparationScreen.jsx";
import RoleplayScreen from "./components/RoleplayScreen.jsx";
import useCoachSession from "./hooks/useCoachSession.js";
import useRoleplayTimer from "./hooks/useRoleplayTimer.js";
import { matchRoleplayResponse } from "./utils/roleplayMatcher.js";
import {
  createMockState,
  createQuestionRetry,
  PRACTICE_DIFFICULTIES,
  progressMockInterview,
} from "./utils/questionProgression.js";
import { scoreMockInterview, scoreRoleplay } from "./utils/scoring.js";
import { advanceTimer, createTimerState, setTimerRunning } from "./utils/timer.js";
import "./interview-coach.css";

const modes = [
  {
    id: "prepare",
    number: "01",
    title: "Prepare",
    duration: "10–15 min",
    description: "Review likely competencies, CV evidence, preparation gaps and the Smart Rebook discovery map.",
  },
  {
    id: "mock",
    number: "02",
    title: "Mock Interview",
    duration: "25–35 min",
    description: "Answer a curated interview question tree one question at a time, with realistic follow-ups.",
  },
  {
    id: "roleplay",
    number: "03",
    title: "Smart Rebook Role-play",
    duration: "10–15 min",
    description: "Run the ten-minute discovery meeting with Duncan using a controlled, deterministic product model.",
  },
];

function WelcomeScreen({ selectedMode, settings, onSelect, onSettingsChange, onStart }) {
  return (
    <main className="ic-main ic-welcome">
      <section className="ic-welcome-hero">
        <div>
          <p className="ic-eyebrow">PRIVATE PRACTICE WORKSPACE / FINAL-STAGE PREP</p>
          <h1>Interview<br /><em>Coach.</em></h1>
          <p className="ic-welcome-copy">A focused interview simulator for discovery, stakeholder communication and customer learning design.</p>
        </div>
        <aside>
          <div><span>SESSION</span><strong>10–35 min</strong></div>
          <div><span>STORAGE</span><strong>This tab only</strong></div>
          <div><span>MODEL</span><strong>Deterministic</strong></div>
          <p>This is a private practice tool, not an assessment result. Answers stay in session storage and are never sent to an AI service or analytics.</p>
        </aside>
      </section>

      <section className="ic-practice-settings" aria-labelledby="practice-style-title">
        <div className="ic-section-heading">
          <div><span>PRACTICE</span><h2 id="practice-style-title">Choose the interview pressure</h2></div>
          <p>The mode changes follow-up frequency and directness only. It does not invent interviewer behaviour or alter the source-backed role-play facts.</p>
        </div>
        <div className="ic-difficulty-grid" role="radiogroup" aria-label="Interview pressure">
          {Object.values(PRACTICE_DIFFICULTIES).map((difficulty) => (
            <button
              className={settings.difficulty === difficulty.id ? "is-selected" : ""}
              type="button"
              role="radio"
              aria-checked={settings.difficulty === difficulty.id}
              onClick={() => onSettingsChange({ difficulty: difficulty.id })}
              key={difficulty.id}
            >
              <strong>{difficulty.title}</strong>
              <span>{difficulty.description}</span>
            </button>
          ))}
        </div>
        <div className="ic-setting-toggles">
          <label>
            <input
              type="checkbox"
              checked={settings.readAloud}
              onChange={(event) => onSettingsChange({ readAloud: event.target.checked })}
            />
            <span><strong>Read interviewer responses aloud</strong>Uses your browser&apos;s built-in speech synthesis, with replay, pause and stop controls.</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.handsFree}
              onChange={(event) => onSettingsChange({
                handsFree: event.target.checked,
                ...(event.target.checked ? { readAloud: true } : {}),
              })}
            />
            <span><strong>Hands-free practice sequence</strong>Listen, press Start recording, review the editable transcript, then send it yourself.</span>
          </label>
        </div>
      </section>

      <section className="ic-mode-section" aria-labelledby="mode-title">
        <div className="ic-section-heading">
          <div><span>SELECT</span><h2 id="mode-title">Choose a mode</h2></div>
          <p>You can move between preparation and practice, then reset the whole tab session at any time.</p>
        </div>
        <div className="ic-mode-grid" role="radiogroup" aria-label="Practice mode">
          {modes.map((mode) => (
            <button
              className={`ic-mode-card ${selectedMode === mode.id ? "is-selected" : ""}`}
              type="button"
              role="radio"
              aria-checked={selectedMode === mode.id}
              onClick={() => onSelect(mode.id)}
              key={mode.id}
            >
              <span>{mode.number}</span>
              <small>{mode.duration}</small>
              <h2>{mode.title}</h2>
              <p>{mode.description}</p>
              <strong>{selectedMode === mode.id ? "Selected" : "Select mode"}</strong>
            </button>
          ))}
        </div>
        <div className="ic-start-row">
          <p><span aria-hidden="true">●</span> Ready when you are. Voice controls are optional and no external AI service is used.</p>
          <button className="ic-primary-button" type="button" onClick={() => onStart(selectedMode)}>Start {modes.find((mode) => mode.id === selectedMode)?.title} →</button>
        </div>
      </section>
    </main>
  );
}

export default function InterviewCoach({ navigate }) {
  const { session, updateSession, resetSession } = useCoachSession();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Interview Coach // Private Lab";
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [session.screen]);

  const startMode = useCallback((mode) => {
    updateSession((current) => {
      if (mode === "prepare") return { ...current, selectedMode: mode, screen: "prepare" };
      if (mode === "mock") {
        const mockSessionCounter = (current.mockSessionCounter || 0) + 1;
        return {
          ...current,
          selectedMode: mode,
          screen: "mock",
          mockSessionCounter,
          mock: createMockState({
            difficulty: current.settings.difficulty,
            sessionNumber: mockSessionCounter,
          }),
          report: null,
        };
      }

      return {
        ...current,
        selectedMode: mode,
        screen: "roleplay",
        roleplay: {
          messages: [{
            id: "duncan-welcome",
            role: "product-owner",
            text: "Hi, thanks for meeting with me. Where would you like to start?",
          }],
          coveredIntents: [],
          turns: [],
          draft: "",
          turnCounter: 0,
          timer: { ...createTimerState(), running: true },
        },
        report: null,
      };
    });
  }, [updateSession]);

  const tickTimer = useCallback(() => {
    updateSession((current) => ({
      ...current,
      roleplay: {
        ...current.roleplay,
        timer: advanceTimer(current.roleplay.timer),
      },
    }));
  }, [updateSession]);

  useRoleplayTimer(session.screen === "roleplay" && session.roleplay.timer.running, tickTimer);

  const submitMockAnswer = (answer) => {
    updateSession((current) => {
      const mock = progressMockInterview(current.mock, answer);
      if (mock.completed) {
        return {
          ...current,
          mock,
          screen: "feedback",
          report: scoreMockInterview(mock.answers),
        };
      }
      return { ...current, mock };
    });
  };

  const endMock = () => {
    updateSession((current) => ({
      ...current,
      screen: "feedback",
      report: scoreMockInterview(current.mock.answers),
    }));
  };

  const sendRoleplayQuestion = (question) => {
    updateSession((current) => {
      const match = matchRoleplayResponse(question, current.roleplay);
      const turnNumber = (current.roleplay.turnCounter || 0) + 1;
      const coveredIntents = new Set(current.roleplay.coveredIntents || []);
      match.answeredIntents.forEach((intent) => coveredIntents.add(intent));
      const turn = {
        id: `turn-${turnNumber}`,
        primaryIntent: match.classification.primaryIntent,
        secondaryIntents: match.classification.secondaryIntents,
        topicId: match.classification.topicId,
        confidence: match.classification.confidence,
        contextUsed: match.classification.contextUsed,
        clarificationNeeded: match.classification.clarificationNeeded,
        clarificationType: match.classification.clarificationType,
        referenceKind: match.classification.referenceKind,
        responseId: match.responseId,
        detailLevel: match.detailLevel,
        sourceRefs: match.sourceRefs,
      };

      return {
        ...current,
        roleplay: {
          ...current.roleplay,
          messages: [
            ...current.roleplay.messages,
            { id: `candidate-${turnNumber}`, role: "candidate", text: question.trim(), turnId: turn.id },
            {
              id: `duncan-${turnNumber}`,
              role: "product-owner",
              text: match.response,
              turnId: turn.id,
              intent: match.intent,
              responseId: match.responseId,
            },
          ],
          coveredIntents: [...coveredIntents],
          turns: [...(current.roleplay.turns || []), turn],
          draft: "",
          turnCounter: turnNumber,
        },
      };
    });
  };

  const updateRoleplayTimer = (updater) => {
    updateSession((current) => ({
      ...current,
      roleplay: {
        ...current.roleplay,
        timer: updater(current.roleplay.timer),
      },
    }));
  };

  const endRoleplay = () => {
    updateSession((current) => {
      const roleplay = {
        ...current.roleplay,
        timer: setTimerRunning(current.roleplay.timer, false),
      };
      return {
        ...current,
        roleplay,
        screen: "feedback",
        report: scoreRoleplay(roleplay),
      };
    });
  };

  const clearWithConfirmation = () => {
    if (window.confirm("Clear all locally stored answers, notes and feedback for this tab session?")) {
      resetSession();
    }
  };

  const retry = () => {
    startMode(session.report?.mode === "Mock Interview" ? "mock" : "roleplay");
  };

  const retryQuestion = (questionId) => {
    updateSession((current) => ({
      ...current,
      mock: createQuestionRetry(current.mock, questionId),
      screen: "mock",
      report: null,
    }));
  };

  const updateSettings = (patch) => {
    updateSession((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  };

  let content;
  if (session.screen === "prepare") {
    content = <PreparationScreen onBack={() => updateSession((current) => ({ ...current, screen: "welcome" }))} onStartMode={startMode} />;
  } else if (session.screen === "mock") {
    content = (
      <MockInterviewScreen
        mock={session.mock}
        settings={session.settings}
        notes={session.notes}
        onSubmit={submitMockAnswer}
        onEnd={endMock}
        onDraftChange={(draft) => updateSession((current) => ({
          ...current,
          mock: { ...current.mock, draft },
        }))}
        onPreparation={() => updateSession((current) => ({ ...current, screen: "prepare" }))}
        onNotesChange={(notes) => updateSession((current) => ({ ...current, notes }))}
        onReadAloudChange={(readAloud) => updateSettings({ readAloud })}
      />
    );
  } else if (session.screen === "roleplay") {
    content = (
      <RoleplayScreen
        roleplay={session.roleplay}
        settings={session.settings}
        notes={session.notes}
        onSend={sendRoleplayQuestion}
        onDraftChange={(draft) => updateSession((current) => ({
          ...current,
          roleplay: { ...current.roleplay, draft },
        }))}
        onPause={() => updateRoleplayTimer((timer) => setTimerRunning(timer, false))}
        onResume={() => updateRoleplayTimer((timer) => setTimerRunning(timer, true))}
        onRestartTimer={() => updateRoleplayTimer(() => ({ ...createTimerState(), running: true }))}
        onEnd={endRoleplay}
        onNotesChange={(notes) => updateSession((current) => ({ ...current, notes }))}
        onReadAloudChange={(readAloud) => updateSettings({ readAloud })}
      />
    );
  } else if (session.screen === "feedback" && session.report) {
    content = (
      <FeedbackScreen
        report={session.report}
        onRetry={retry}
        onRetryQuestion={retryQuestion}
        onPreparation={() => updateSession((current) => ({ ...current, screen: "prepare" }))}
        onReset={clearWithConfirmation}
      />
    );
  } else {
    content = (
      <WelcomeScreen
        selectedMode={session.selectedMode}
        settings={session.settings}
        onSelect={(selectedMode) => updateSession((current) => ({ ...current, selectedMode }))}
        onSettingsChange={updateSettings}
        onStart={startMode}
      />
    );
  }

  return (
    <div className="ic-app">
      <a className="ic-skip-link" href="#interview-coach-content">Skip to practice content</a>
      <CoachHeader screen={session.screen} navigate={navigate} onClear={clearWithConfirmation} />
      <div id="interview-coach-content">{content}</div>
    </div>
  );
}
