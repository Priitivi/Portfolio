export const SIMULATION_STORAGE_KEY = "priit-lab:graduate-assessment:simulation:v1";
export const SIMULATION_CHECKPOINT_VERSION = 1;

export function validateSimulation(simulation) {
  const issues = [];
  if (!simulation?.sections?.length) issues.push("Simulation has no sections");
  if (!["standard", "extended", "untimed"].includes(simulation?.timingProfile)) issues.push("Simulation has an invalid timing profile");
  const questions = simulation?.sections?.flatMap((section) => section.questions || []) || [];
  if (new Set(questions.map((question) => question.id)).size !== questions.length) issues.push("Simulation contains duplicate question ids");
  for (const section of simulation?.sections || []) {
    if (simulation?.timingProfile === "untimed" ? section.seconds !== null : !section.seconds || section.seconds < 60) issues.push(`${section.id} has an invalid timer`);
    if (!section.questions?.length) issues.push(`${section.id} has no questions`);
    for (const question of section.questions || []) {
      if (!Array.isArray(question.options) || question.options.length !== 4 && question.category !== "verbal") issues.push(`${question.id} has invalid options`);
      if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) issues.push(`${question.id} has an invalid answer`);
    }
  }
  return { valid: issues.length === 0, issues };
}

export function createSimulationCheckpoint(simulation, now = Date.now()) {
  if (!simulation?.sections?.length) return null;
  return {
    version: SIMULATION_CHECKPOINT_VERSION,
    simulation,
    phase: "running",
    sectionIndex: 0,
    questionIndex: 0,
    answers: [],
    sectionStartedAt: Number(now),
    sectionDeadline: simulation.sections[0].seconds === null ? null : Number(now) + simulation.sections[0].seconds * 1000,
    savedAt: new Date(now).toISOString(),
  };
}

function safeInteger(value, maximum) {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) ? Math.max(0, Math.min(maximum, numeric)) : 0;
}

export function loadSimulationCheckpoint(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed?.version !== SIMULATION_CHECKPOINT_VERSION || !parsed.simulation?.sections?.length || parsed.phase !== "running") return null;
    if (!validateSimulation(parsed.simulation).valid) return null;
    const sectionIndex = safeInteger(parsed.sectionIndex, parsed.simulation.sections.length - 1);
    const section = parsed.simulation.sections[sectionIndex];
    if (!section?.questions?.length) return null;
    const questionIds = new Set(parsed.simulation.sections.flatMap((item) => item.questions.map((question) => question.id)));
    const seenAnswers = new Set();
    const answers = Array.isArray(parsed.answers) ? parsed.answers.filter((answer) => {
      if (!questionIds.has(answer?.questionId) || seenAnswers.has(answer.questionId)) return false;
      seenAnswers.add(answer.questionId);
      return true;
    }).slice(0, questionIds.size) : [];
    return {
      ...parsed,
      sectionIndex,
      questionIndex: safeInteger(parsed.questionIndex, section.questions.length - 1),
      answers,
      sectionStartedAt: Number.isFinite(Number(parsed.sectionStartedAt)) ? Number(parsed.sectionStartedAt) : Date.now(),
      sectionDeadline: parsed.sectionDeadline === null && parsed.simulation.timingProfile === "untimed"
        ? null
        : Number.isFinite(Number(parsed.sectionDeadline)) ? Number(parsed.sectionDeadline) : Date.now(),
    };
  } catch {
    return null;
  }
}

export function remainingSimulationSeconds(deadline, now = Date.now()) {
  const target = Number(deadline);
  const current = Number(now);
  if (!Number.isFinite(target) || !Number.isFinite(current)) return 0;
  return Math.max(0, Math.ceil((target - current) / 1000));
}
