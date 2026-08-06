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

export function answerReview(question, selected) {
  const answer = Number(question?.answer);
  const choice = Number(selected);
  const correct = choice === answer;
  const model = question?.category === "situational"
    ? question?.optionDetails?.[answer]?.rationale || question?.explanation
    : question?.explanation;
  if (correct) return { model, selected: null };
  if (choice < 0) return { model, selected: "No option was recorded before the time limit. Rebuild the method untimed, then repeat with pace." };
  if (question?.category === "situational") {
    return { model, selected: question?.optionDetails?.[choice]?.rationale || "This response creates a weaker balance of impact, ownership and proportionality." };
  }
  if (question?.category === "verbal") {
    const labels = ["True", "False", "Cannot say"];
    if (labels[answer] === "Cannot say") return { model, selected: "This choice goes beyond the passage. The missing evidence means neither True nor False is justified." };
    if (labels[choice] === "Cannot say") return { model, selected: "The passage contains enough direct evidence to decide. Locate the exact sentence or comparison before classifying it." };
    return { model, selected: "This choice reverses what the passage establishes. Match the statement to the exact evidence rather than its general topic." };
  }
  if (question?.category === "logical") return { model, selected: "The selected tile breaks at least one independent rule. Check count, rotation, fill and marker position separately before combining them." };
  if (question?.category === "numerical") {
    const misconceptionByTopic = {
      percentages: "Check which value is the base, then distinguish a percentage change from a percentage-point difference.",
      ratios: "Convert the whole into total ratio parts before finding one part or scaling a side.",
      currency: "Write the units on both sides of the exchange rate so the direction of multiplication or division is explicit.",
      tables: "Trace the requested row and column labels, then combine only the cells named in the question.",
      charts: "Read the axis and series first, then calculate from the requested values rather than the nearest visual estimate.",
      "profit-loss": "Separate revenue, variable cost and fixed cost, then use the denominator named in the question.",
      averages: "Add the complete set and divide by its number of values; do not average partial averages without their weights.",
      probability: "Define the favourable outcomes and the total outcomes, and use the complement only when it simplifies the event.",
    };
    return { model, selected: misconceptionByTopic[question?.topic] || "Recheck the units and operation order before comparing your result with the answer choices." };
  }
  return { model, selected: "This choice does not follow the evidence rule used by the model answer." };
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
