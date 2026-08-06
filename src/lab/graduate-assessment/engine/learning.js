import { difficultySettings } from "./questions.js";
import { adjustedSeconds } from "./timing.js";

const numericalStrategies = {
  percentages: "Write the original amount and the percentage multiplier before calculating. For reverse percentages, divide by the final multiplier rather than subtracting the rate.",
  ratios: "Translate every ratio part into one common unit first. Check that allocated parts recombine to the stated total.",
  currency: "Write the direction of each exchange rate beside the calculation. Apply fees to the converted amount at the stage where they occur.",
  tables: "Read the row and column labels before using a value. Build the required total from only the cells named in the question.",
  charts: "Confirm the chart unit and baseline, then estimate the expected range before calculating precisely.",
  "profit-loss": "Separate revenue, cost and profit. A margin uses revenue as its denominator; a markup uses cost.",
  averages: "Convert a mean back into a total before adding, removing or combining observations.",
  probability: "Define the complete outcome set first. For repeated events, decide whether replacement changes the denominator.",
};

const categoryStrategies = {
  verbal: "Test only what the passage establishes. Treat a plausible claim as Cannot Say when the necessary evidence or comparison is missing.",
  logical: "Describe each changing feature separately—shape, count, fill, position and rotation—then combine the rules for the missing tile.",
  situational: "Compare proportionality, transparency, ownership and impact. The strongest model response should address the issue without creating a larger risk.",
};

export function learningSignal(question, answer, timingProfile = "standard") {
  const correct = Boolean(answer?.correct);
  const timedOut = Number(answer?.selected) < 0;
  const standardTarget = difficultySettings[question?.difficulty]?.seconds || 75;
  const effectiveTarget = adjustedSeconds(standardTarget, timingProfile);
  const seconds = Math.max(1, Math.round(Number(answer?.seconds) || 1));
  const withinTarget = effectiveTarget === null ? null : seconds <= effectiveTarget;
  const strategy = question?.category === "numerical"
    ? numericalStrategies[question.topic] || "Name the quantities, units and operation before calculating."
    : categoryStrategies[question?.category] || "State the evidence and rule before selecting an answer.";

  let headline = "Rebuild the method";
  let nextStep = "Try another question from this topic and narrate the rule before selecting an option.";
  if (timedOut) {
    headline = "Method before speed";
    nextStep = "Repeat this topic with Untimed learning, then restore the countdown after the method feels automatic.";
  } else if (correct && withinTarget === true) {
    headline = "Accurate and on pace";
    nextStep = "Keep the method, then confirm it transfers to a fresh context rather than memorising this item.";
  } else if (correct) {
    headline = effectiveTarget === null ? "Accurate method" : "Accurate; now compress the steps";
    nextStep = effectiveTarget === null
      ? "Repeat with Assessment pace when you want to test retrieval speed."
      : "Keep the same written setup, but remove any step that does not change the answer.";
  } else if (withinTarget === true) {
    headline = "Fast answer; check the rule";
    nextStep = "Slow the first step down: identify the evidence boundary or operation before calculating or classifying.";
  }

  return {
    headline,
    strategy,
    nextStep,
    pace: effectiveTarget === null ? "Pace was not scored in Untimed learning." : `${seconds}s response against a ${effectiveTarget}s practice target.`,
    withinTarget,
  };
}

export function sessionLearningSummary(questions, answers, timingProfile = "standard") {
  const paired = answers.map((answer, index) => ({ answer, question: questions[index] })).filter((item) => item.question);
  const timedOut = paired.filter(({ answer }) => Number(answer.selected) < 0).length;
  const correctOnPace = paired.filter(({ answer, question }) => {
    const signal = learningSignal(question, answer, timingProfile);
    return answer.correct && signal.withinTarget === true;
  }).length;
  const misses = new Map();
  for (const { answer, question } of paired) {
    if (answer.correct) continue;
    const key = question.topic || "general";
    misses.set(key, (misses.get(key) || 0) + 1);
  }
  const focusTopic = [...misses.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || null;
  return { timedOut, correctOnPace, focusTopic };
}
