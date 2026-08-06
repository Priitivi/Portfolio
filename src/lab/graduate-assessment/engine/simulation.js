import { createPracticeSession, difficultySettings, isCorrectAnswer } from "./questions.js";
import { adjustedSeconds, timingProfile } from "./timing.js";
export {
  createSimulationCheckpoint,
  loadSimulationCheckpoint,
  remainingSimulationSeconds,
  SIMULATION_CHECKPOINT_VERSION,
  SIMULATION_STORAGE_KEY,
  validateSimulation,
} from "./checkpoint.js";

export const simulationFormats = [
  {
    id: "quick",
    label: "Quick simulation",
    description: "Twelve mixed reasoning questions under one short timer.",
    questionCount: 12,
    approximateMinutes: 12,
    sections: [
      {
        id: "mixed-reasoning",
        label: "Mixed reasoning",
        seconds: 12 * 60,
        mixed: true,
        allocations: [
          { category: "numerical", difficulty: "standard", count: 4 },
          { category: "verbal", difficulty: "standard", count: 4 },
          { category: "logical", difficulty: "standard", count: 4 },
        ],
      },
    ],
  },
  {
    id: "standard",
    label: "Standard graduate simulation",
    description: "Twenty-seven questions across timed numerical, verbal and logical sections.",
    questionCount: 27,
    approximateMinutes: 27,
    sections: [
      { id: "numerical", label: "Numerical reasoning", seconds: 10 * 60, allocations: [{ category: "numerical", difficulty: "foundation", count: 2 }, { category: "numerical", difficulty: "standard", count: 4 }, { category: "numerical", difficulty: "advanced", count: 3 }] },
      { id: "verbal", label: "Verbal reasoning", seconds: 9 * 60, allocations: [{ category: "verbal", difficulty: "foundation", count: 2 }, { category: "verbal", difficulty: "standard", count: 4 }, { category: "verbal", difficulty: "advanced", count: 3 }] },
      { id: "logical", label: "Logical reasoning", seconds: 8 * 60, allocations: [{ category: "logical", difficulty: "foundation", count: 2 }, { category: "logical", difficulty: "standard", count: 4 }, { category: "logical", difficulty: "advanced", count: 3 }] },
    ],
  },
  {
    id: "full",
    label: "Full practice assessment",
    description: "Multiple timed sections with optional situational judgement and end-only review.",
    questionCount: 32,
    approximateMinutes: 38,
    sections: [
      { id: "numerical", label: "Numerical reasoning", seconds: 10 * 60, allocations: [{ category: "numerical", difficulty: "foundation", count: 2 }, { category: "numerical", difficulty: "standard", count: 3 }, { category: "numerical", difficulty: "advanced", count: 3 }] },
      { id: "verbal", label: "Verbal reasoning", seconds: 9 * 60, allocations: [{ category: "verbal", difficulty: "foundation", count: 2 }, { category: "verbal", difficulty: "standard", count: 3 }, { category: "verbal", difficulty: "advanced", count: 3 }] },
      { id: "logical", label: "Logical reasoning", seconds: 8 * 60, allocations: [{ category: "logical", difficulty: "foundation", count: 2 }, { category: "logical", difficulty: "standard", count: 3 }, { category: "logical", difficulty: "advanced", count: 3 }] },
      { id: "situational", label: "Situational judgement", seconds: 11 * 60, optional: true, allocations: [{ category: "situational", difficulty: "foundation", count: 2 }, { category: "situational", difficulty: "standard", count: 3 }, { category: "situational", difficulty: "advanced", count: 3 }] },
    ],
  },
];

function seededRandom(seed = Date.now()) {
  let value = (Math.abs(Number(seed) || 1) >>> 0) + 0x6d2b79f5;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function extendSelectionContext(context, questions) {
  return {
    ...context,
    recentQuestionIds: [...(context.recentQuestionIds || []), ...questions.map((question) => question.id)],
    recentPassageIds: [...(context.recentPassageIds || []), ...questions.map((question) => question.passageId).filter(Boolean)],
    recentTemplateIds: [...(context.recentTemplateIds || []), ...questions.map((question) => question.templateId).filter(Boolean)],
  };
}

export function assembleSimulation({ formatId = "quick", seed = Date.now(), includeSituational = true, timingProfileId = "standard", selectionContext = {} } = {}) {
  const format = simulationFormats.find((item) => item.id === formatId);
  if (!format) throw new Error(`Unknown simulation format: ${formatId}`);
  const selectedTiming = timingProfile(timingProfileId);
  const random = seededRandom(seed);
  let evolvingContext = { ...selectionContext };
  const usedIds = new Set();
  const sections = format.sections
    .filter((section) => !section.optional || includeSituational)
    .map((section, sectionIndex) => {
      let questions = [];
      for (const allocation of section.allocations) {
        const allocationSeed = Math.floor(random() * 2_000_000_000) + sectionIndex;
        const generated = createPracticeSession({ ...allocation, seed: allocationSeed, selectionContext: evolvingContext });
        for (const question of generated) {
          if (usedIds.has(question.id)) throw new Error(`Duplicate simulation question id: ${question.id}`);
          usedIds.add(question.id);
          questions.push(question);
        }
        evolvingContext = extendSelectionContext(evolvingContext, generated);
      }
      if (section.mixed) questions = shuffle(questions, random);
      return { id: section.id, label: section.label, baseSeconds: section.seconds, seconds: adjustedSeconds(section.seconds, selectedTiming.id), questions };
    });
  return {
    id: `simulation-${format.id}-${seed}`,
    formatId: format.id,
    label: format.label,
    seed: Number(seed),
    includeSituational: Boolean(includeSituational),
    timingProfile: selectedTiming.id,
    sections,
  };
}

export function createSimulationAnswer(question, selected, seconds) {
  return {
    questionId: question.id,
    category: question.category,
    difficulty: question.difficulty,
    topic: question.topic || "general",
    selected: Number(selected),
    correct: isCorrectAnswer(question, selected),
    seconds: Math.max(1, Math.min(3600, Math.round(Number(seconds) || 1))),
    ...(question.passageId ? { passageId: question.passageId } : {}),
    ...(question.templateId ? { templateId: question.templateId } : {}),
  };
}

export function simulationResults(simulation, answers) {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const byQuestion = new Map(safeAnswers.map((answer) => [answer.questionId, answer]));
  const sections = simulation.sections.map((section) => {
    const sectionAnswers = section.questions.map((question) => byQuestion.get(question.id)).filter(Boolean);
    const correct = sectionAnswers.filter((answer) => answer.correct).length;
    const timedOut = sectionAnswers.filter((answer) => Number(answer.selected) < 0).length;
    return {
      id: section.id,
      label: section.label,
      attempted: sectionAnswers.length,
      total: section.questions.length,
      correct,
      timedOut,
      accuracy: sectionAnswers.length ? Math.round(correct / sectionAnswers.length * 100) : 0,
      averageTime: sectionAnswers.length ? Math.round(sectionAnswers.reduce((sum, answer) => sum + answer.seconds, 0) / sectionAnswers.length) : 0,
    };
  });
  const attempted = safeAnswers.length;
  const correct = safeAnswers.filter((answer) => answer.correct).length;
  const timedOut = safeAnswers.filter((answer) => Number(answer.selected) < 0).length;
  return {
    attempted,
    correct,
    timedOut,
    accuracy: attempted ? Math.round(correct / attempted * 100) : 0,
    averageTime: attempted ? Math.round(safeAnswers.reduce((sum, answer) => sum + answer.seconds, 0) / attempted) : 0,
    sections,
  };
}

export function sectionTargetSeconds(question) {
  return difficultySettings[question.difficulty]?.seconds || 75;
}
