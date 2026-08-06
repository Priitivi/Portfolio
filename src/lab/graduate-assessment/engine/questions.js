import { graduateCorePack, numericalTopics } from "../data/packs.js";
import { alternateNumericalFactories } from "./numerical-expansion.js";

export const answerLabels = ["A", "B", "C", "D"];
export const verbalOptions = ["True", "False", "Cannot say"];
export const difficultySettings = {
  foundation: { label: "Foundation", seconds: 105, rank: 1 },
  standard: { label: "Standard", seconds: 75, rank: 2 },
  advanced: { label: "Advanced", seconds: 55, rank: 3 },
};

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

function int(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = int(random, 0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function round(value, places = 2) {
  const scale = 10 ** places;
  return Math.round((Number(value) + Number.EPSILON) * scale) / scale;
}

function formatNumber(value, places = 2) {
  return Number(value).toLocaleString("en-GB", { maximumFractionDigits: places });
}

function money(value, currency = "£") {
  const numeric = Number(value);
  const sign = numeric < 0 ? "−" : "";
  return `${sign}${currency}${Math.abs(numeric).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

function numericOptions(correctValue, distractors, random, formatter = (value) => formatNumber(value), bounds = {}) {
  const correct = round(correctValue);
  const minimum = bounds.min ?? Number.NEGATIVE_INFINITY;
  const maximum = bounds.max ?? Number.POSITIVE_INFINITY;
  const candidates = [correct, ...distractors.map((value) => round(value))].filter((value) => Number.isFinite(value) && value >= minimum && value <= maximum);
  const uniqueValues = [];
  const formatted = new Set();
  for (const value of candidates) {
    const display = formatter(value);
    if (uniqueValues.some((item) => item === value) || formatted.has(display)) continue;
    uniqueValues.push(value);
    formatted.add(display);
    if (uniqueValues.length === 4) break;
  }
  const offset = Math.max(1, Math.abs(correct) * 0.1);
  let attempt = 1;
  while (uniqueValues.length < 4) {
    const direction = attempt % 2 ? 1 : -1;
    const candidate = round(correct + direction * offset * Math.ceil(attempt / 2));
    const display = formatter(candidate);
    if (candidate >= minimum && candidate <= maximum && !uniqueValues.includes(candidate) && !formatted.has(display)) {
      uniqueValues.push(candidate);
      formatted.add(display);
    }
    attempt += 1;
    if (attempt > 1000) throw new Error("Unable to create four unique numeric answer choices");
  }
  const optionValues = shuffle(uniqueValues, random);
  return {
    options: optionValues.map(formatter),
    optionValues,
    answer: optionValues.indexOf(correct),
  };
}

function withAudit(question, kind, inputs, correctValue, optionResult, unit) {
  return {
    ...question,
    options: optionResult.options,
    answer: optionResult.answer,
    audit: { kind, inputs, correctValue: round(correctValue), optionValues: optionResult.optionValues, unit },
  };
}

function percentageQuestion(random, difficulty) {
  const base = int(random, 12, 42) * 10;
  const firstRate = int(random, 2, difficulty === "foundation" ? 6 : 9) * 5;
  if (difficulty === "foundation") {
    const result = base * (1 + firstRate / 100);
    const optionResult = numericOptions(result, [base + firstRate, base * firstRate / 100, base * (1 - firstRate / 100)], random, (value) => `${formatNumber(value)} requests`);
    return withAudit({
      prompt: `A service team processed ${base} requests in June. July volume was ${firstRate}% higher. How many requests did it process in July?`,
      explanation: `${firstRate}% of ${base} is ${formatNumber(base * firstRate / 100)}. Add the increase: ${base} + ${formatNumber(base * firstRate / 100)} = ${formatNumber(result)} requests.`,
    }, "percentage-increase", { base, firstRate }, result, optionResult, "requests");
  }
  if (difficulty === "standard") {
    const result = base * (1 - firstRate / 100);
    const optionResult = numericOptions(result, [base - firstRate, base * firstRate / 100, base * (1 + firstRate / 100)], random, (value) => `${formatNumber(value)} applications`);
    return withAudit({
      prompt: `A programme received ${base} applications last month. This month the total was ${firstRate}% lower. How many applications were received this month?`,
      explanation: `${firstRate}% of ${base} is ${formatNumber(base * firstRate / 100)}. Subtract that reduction: ${base} − ${formatNumber(base * firstRate / 100)} = ${formatNumber(result)} applications.`,
    }, "percentage-decrease", { base, firstRate }, result, optionResult, "applications");
  }
  const secondRate = int(random, 2, 6) * 5;
  const result = base * (1 + firstRate / 100) * (1 - secondRate / 100);
  const afterIncrease = base * (1 + firstRate / 100);
  const optionResult = numericOptions(result, [base * (1 + (firstRate - secondRate) / 100), afterIncrease, base * (1 - secondRate / 100)], random, (value) => `${formatNumber(value)} accounts`);
  return withAudit({
    prompt: `A platform had ${base} active accounts. The total rose by ${firstRate}% in one quarter, then fell by ${secondRate}% in the next. How many accounts remained?`,
    explanation: `After the rise: ${base} × ${(1 + firstRate / 100).toFixed(2)} = ${formatNumber(afterIncrease)}. Apply the fall to that new total: ${formatNumber(afterIncrease)} × ${(1 - secondRate / 100).toFixed(2)} = ${formatNumber(result)} accounts. Percentage changes are applied successively, not netted.`,
  }, "successive-percentages", { base, firstRate, secondRate }, result, optionResult, "accounts");
}

function ratioQuestion(random, difficulty) {
  const left = int(random, 2, 5);
  const right = int(random, 3, 7);
  const groups = int(random, 5, 12);
  if (difficulty === "foundation") {
    const total = (left + right) * groups;
    const result = right * groups;
    const optionResult = numericOptions(result, [left * groups, total / right, total - right], random, (value) => `${formatNumber(value, 0)} people`);
    return withAudit({
      prompt: `A graduate cohort has analysts and engineers in the ratio ${left}:${right}. There are ${total} people in total. How many are engineers?`,
      explanation: `There are ${left + right} ratio parts. Each part is ${total} ÷ ${left + right} = ${groups}; engineers occupy ${right} parts, so ${right} × ${groups} = ${result}.`,
    }, "ratio-share", { left, right, groups }, result, optionResult, "people");
  }
  const third = int(random, 2, 6);
  const total = (left + right + third) * groups;
  if (difficulty === "standard") {
    const result = third * groups;
    const optionResult = numericOptions(result, [right * groups, total / third, (left + third) * groups], random, (value) => `${formatNumber(value, 0)} hours`);
    return withAudit({
      prompt: `A project allocates research, design and testing time in the ratio ${left}:${right}:${third}. The total allocation is ${total} hours. How many hours are assigned to testing?`,
      explanation: `The ratio contains ${left + right + third} parts. Each part is ${total} ÷ ${left + right + third} = ${groups} hours. Testing receives ${third} × ${groups} = ${result} hours.`,
    }, "three-part-ratio", { left, right, third, groups }, result, optionResult, "hours");
  }
  const initialEngineers = right * groups;
  const initialAnalysts = left * groups;
  const added = int(random, 2, 6);
  const result = (initialEngineers + added) / (initialEngineers + initialAnalysts + added) * 100;
  const optionResult = numericOptions(result, [initialEngineers / (initialEngineers + initialAnalysts) * 100, (initialEngineers + added) / (initialEngineers + initialAnalysts) * 100, added / (initialEngineers + initialAnalysts + added) * 100], random, (value) => `${formatNumber(value)}%`);
  return withAudit({
    prompt: `A team has analysts and engineers in the ratio ${left}:${right}, with ${groups * (left + right)} people initially. After ${added} engineers join, what percentage of the team are engineers?`,
    explanation: `Initially there are ${initialEngineers} engineers and ${initialAnalysts} analysts. After the hires there are ${initialEngineers + added} engineers out of ${initialEngineers + initialAnalysts + added} people: ${initialEngineers + added} ÷ ${initialEngineers + initialAnalysts + added} × 100 = ${formatNumber(result)}%.`,
  }, "ratio-after-change", { left, right, groups, added }, result, optionResult, "percent");
}

function currencyQuestion(random, difficulty) {
  const pounds = int(random, 8, 28) * 100;
  const rate = [1.12, 1.16, 1.21, 1.25][int(random, 0, 3)];
  const fee = difficulty === "foundation" ? 0 : difficulty === "standard" ? int(random, 1, 2) : int(random, 2, 3);
  const converted = pounds * rate;
  if (difficulty !== "advanced") {
    const result = converted * (1 - fee / 100);
    const optionResult = numericOptions(result, [pounds / rate, converted, converted * (1 + fee / 100)], random, (value) => money(value, "€"));
    return withAudit({
      prompt: fee
        ? `A project budget of ${money(pounds)} is converted at £1 = €${rate.toFixed(2)}. A ${fee}% fee is deducted from the euro amount. How many euros remain?`
        : `A project budget of ${money(pounds)} is converted at £1 = €${rate.toFixed(2)}. How many euros does the project receive?`,
      explanation: fee
        ? `${money(pounds)} × ${rate.toFixed(2)} = ${money(converted, "€")}. After the ${fee}% fee, ${100 - fee}% remains: ${money(converted, "€")} × ${(1 - fee / 100).toFixed(2)} = ${money(result, "€")}.`
        : `Multiply the pound amount by the quoted euros-per-pound rate: ${money(pounds)} × ${rate.toFixed(2)} = ${money(result, "€")}.`,
    }, fee ? "currency-with-fee" : "currency-conversion", { pounds, rate, fee }, result, optionResult, "EUR");
  }
  const euroExpense = int(random, 2, 7) * 100;
  const result = converted * (1 - fee / 100) - euroExpense;
  const afterFee = converted * (1 - fee / 100);
  const optionResult = numericOptions(result, [converted - euroExpense, afterFee + euroExpense, pounds - euroExpense], random, (value) => money(value, "€"));
  return withAudit({
    prompt: `A ${money(pounds)} budget is converted at £1 = €${rate.toFixed(2)}. A ${fee}% conversion fee is deducted, then a ${money(euroExpense, "€")} supplier invoice is paid. How many euros remain?`,
    explanation: `Convert first: ${money(pounds)} × ${rate.toFixed(2)} = ${money(converted, "€")}. After the fee: ${money(converted, "€")} × ${(1 - fee / 100).toFixed(2)} = ${money(afterFee, "€")}. Subtract the invoice: ${money(afterFee, "€")} − ${money(euroExpense, "€")} = ${money(result, "€")}.`,
  }, "currency-budget", { pounds, rate, fee, euroExpense }, result, optionResult, "EUR");
}

function tableQuestion(random, difficulty) {
  const rows = [
    { label: "North", q1: int(random, 42, 55), q2: int(random, 58, 75) },
    { label: "Central", q1: int(random, 36, 50), q2: int(random, 54, 72) },
    { label: "South", q1: int(random, 45, 57), q2: int(random, 61, 79) },
  ];
  const rowIndex = int(random, 0, rows.length - 1);
  const row = rows[rowIndex];
  const context = { type: "table", title: "Service cases resolved", columns: ["Region", "Q1", "Q2"], rows: rows.map((item) => [item.label, item.q1, item.q2]) };
  if (difficulty === "foundation") {
    const result = row.q2 - row.q1;
    const optionResult = numericOptions(result, [row.q2 + row.q1, row.q1, row.q2], random, (value) => `${formatNumber(value, 0)} cases`);
    return withAudit({ prompt: `By how many cases did the ${row.label} region's resolved total increase from Q1 to Q2?`, context, explanation: `Read the ${row.label} row and subtract Q1 from Q2: ${row.q2} − ${row.q1} = ${result} cases.` }, "table-difference", { rows, rowIndex }, result, optionResult, "cases");
  }
  if (difficulty === "standard") {
    const result = (row.q2 - row.q1) / row.q1 * 100;
    const optionResult = numericOptions(result, [(row.q2 - row.q1) / row.q2 * 100, row.q2 / row.q1 * 100, row.q2 - row.q1], random, (value) => `${formatNumber(value)}%`);
    return withAudit({ prompt: `What was the percentage increase in resolved cases for the ${row.label} region from Q1 to Q2?`, context, explanation: `The increase is ${row.q2} − ${row.q1} = ${row.q2 - row.q1}. Divide by the original Q1 value: ${row.q2 - row.q1} ÷ ${row.q1} × 100 = ${formatNumber(result)}%.` }, "table-percentage-change", { rows, rowIndex }, result, optionResult, "percent");
  }
  const q2Total = rows.reduce((sum, item) => sum + item.q2, 0);
  const result = (rows[0].q2 + rows[2].q2) / q2Total * 100;
  const optionResult = numericOptions(result, [(rows[0].q2 + rows[2].q2) / rows.reduce((sum, item) => sum + item.q1, 0) * 100, rows[1].q2 / q2Total * 100, (rows[0].q2 + rows[2].q2) / 2], random, (value) => `${formatNumber(value)}%`);
  return withAudit({ prompt: "What percentage of all Q2 resolved cases came from the North and South regions combined?", context, explanation: `North and South resolved ${rows[0].q2} + ${rows[2].q2} = ${rows[0].q2 + rows[2].q2} cases. All regions resolved ${q2Total}. ${rows[0].q2 + rows[2].q2} ÷ ${q2Total} × 100 = ${formatNumber(result)}%.` }, "table-combined-share", { rows }, result, optionResult, "percent");
}

function chartQuestion(random, difficulty) {
  const values = [
    { label: "Mon", value: int(random, 40, 52) },
    { label: "Tue", value: int(random, 54, 67) },
    { label: "Wed", value: int(random, 46, 58) },
    { label: "Thu", value: int(random, 68, 82) },
  ];
  const context = { type: "bars", title: "Orders checked per day", values };
  if (difficulty === "foundation") {
    const highest = Math.max(...values.map((item) => item.value));
    const lowest = Math.min(...values.map((item) => item.value));
    const result = highest - lowest;
    const optionResult = numericOptions(result, [highest + lowest, highest, lowest], random, (value) => `${formatNumber(value, 0)} orders`);
    return withAudit({ prompt: "What is the range between the highest and lowest daily order totals?", context, explanation: `The highest value is ${highest}; the lowest is ${lowest}. The range is ${highest} − ${lowest} = ${result} orders.` }, "chart-range", { values }, result, optionResult, "orders");
  }
  if (difficulty === "standard") {
    const total = values.reduce((sum, item) => sum + item.value, 0);
    const result = total / values.length;
    const optionResult = numericOptions(result, [total / 3, (values[0].value + values[3].value) / 2, total], random, (value) => `${formatNumber(value)} orders`);
    return withAudit({ prompt: "What was the mean number of orders checked per day?", context, explanation: `Add the four daily values: ${values.map((item) => item.value).join(" + ")} = ${total}. Divide by 4: ${total} ÷ 4 = ${formatNumber(result)} orders.` }, "chart-mean", { values }, result, optionResult, "orders");
  }
  const first = values[0].value;
  const last = values[3].value;
  const result = (last - first) / first * 100;
  const optionResult = numericOptions(result, [(last - first) / last * 100, last / first * 100, last - first], random, (value) => `${formatNumber(value)}%`);
  return withAudit({ prompt: "By what percentage was Thursday's checked-order total higher than Monday's?", context, explanation: `The increase is ${last} − ${first} = ${last - first}. Divide by Monday's original value: ${last - first} ÷ ${first} × 100 = ${formatNumber(result)}%.` }, "chart-percentage-change", { values }, result, optionResult, "percent");
}

function profitQuestion(random, difficulty) {
  const units = int(random, 8, 18) * 100;
  const price = int(random, 24, 40);
  const variable = int(random, 9, 18);
  const fixed = int(random, 4, 9) * 1000;
  const baseProfit = units * (price - variable) - fixed;
  if (difficulty === "foundation") {
    const optionResult = numericOptions(baseProfit, [units * price - fixed, units * (price - variable), fixed - units * (price - variable)], random, (value) => money(value));
    return withAudit({ prompt: `A product sells ${formatNumber(units, 0)} units at ${money(price)} each. Variable cost is ${money(variable)} per unit and fixed cost is ${money(fixed)}. What is the profit?`, explanation: `Contribution is ${money(price - variable)} per unit. ${formatNumber(units, 0)} × ${money(price - variable)} = ${money(units * (price - variable))}; subtract ${money(fixed)} fixed cost to get ${money(baseProfit)} profit.` }, "profit", { units, price, variable, fixed }, baseProfit, optionResult, "GBP");
  }
  if (difficulty === "standard") {
    const revenue = units * price;
    const result = baseProfit / revenue * 100;
    const optionResult = numericOptions(result, [baseProfit / (units * variable + fixed) * 100, (price - variable) / price * 100, baseProfit / units], random, (value) => `${formatNumber(value)}%`);
    return withAudit({ prompt: `A product sells ${formatNumber(units, 0)} units at ${money(price)} each. Variable cost is ${money(variable)} per unit and fixed cost is ${money(fixed)}. What is profit as a percentage of revenue?`, explanation: `Revenue is ${formatNumber(units, 0)} × ${money(price)} = ${money(revenue)}. Profit is ${money(baseProfit)}. Profit margin is ${money(baseProfit)} ÷ ${money(revenue)} × 100 = ${formatNumber(result)}%.` }, "profit-margin", { units, price, variable, fixed }, result, optionResult, "percent");
  }
  const returnRate = int(random, 1, 3) * 5;
  const keptUnits = units * (1 - returnRate / 100);
  const result = keptUnits * price - units * variable - fixed;
  const optionResult = numericOptions(result, [keptUnits * (price - variable) - fixed, baseProfit, units * price * (1 - returnRate / 100) - keptUnits * variable - fixed], random, (value) => money(value));
  return withAudit({ prompt: `A campaign ships ${formatNumber(units, 0)} units at ${money(price)} each. Variable cost is incurred on every shipped unit at ${money(variable)}, fixed cost is ${money(fixed)}, and ${returnRate}% of units are fully refunded. What profit remains?`, explanation: `${returnRate}% are refunded, so revenue is kept on ${formatNumber(keptUnits, 0)} units: ${formatNumber(keptUnits, 0)} × ${money(price)} = ${money(keptUnits * price)}. Costs still apply to all shipped units: ${formatNumber(units, 0)} × ${money(variable)} + ${money(fixed)} = ${money(units * variable + fixed)}. Profit is ${money(result)}.` }, "profit-after-returns", { units, price, variable, fixed, returnRate }, result, optionResult, "GBP");
}

function averageQuestion(random, difficulty) {
  if (difficulty === "foundation") {
    const values = Array.from({ length: 4 }, () => int(random, 12, 28) * 4);
    const result = values.reduce((sum, value) => sum + value, 0) / values.length;
    const optionResult = numericOptions(result, [values.reduce((sum, value) => sum + value, 0) / 3, (Math.max(...values) + Math.min(...values)) / 2, values.reduce((sum, value) => sum + value, 0)], random, (value) => `${formatNumber(value)} minutes`);
    return withAudit({ prompt: `A team recorded task times of ${values.join(", ")} minutes. What was the mean task time?`, explanation: `Add the four times to get ${values.reduce((sum, value) => sum + value, 0)}, then divide by 4: ${formatNumber(result)} minutes.` }, "mean", { values }, result, optionResult, "minutes");
  }
  if (difficulty === "standard") {
    const firstCount = int(random, 3, 6);
    const secondCount = int(random, 4, 8);
    const firstMean = int(random, 40, 60);
    const secondMean = int(random, 62, 82);
    const result = (firstCount * firstMean + secondCount * secondMean) / (firstCount + secondCount);
    const optionResult = numericOptions(result, [(firstMean + secondMean) / 2, (firstCount * firstMean + secondCount * secondMean) / 2, (firstMean * secondCount + secondMean * firstCount) / (firstCount + secondCount)], random, (value) => `${formatNumber(value)} points`);
    return withAudit({ prompt: `A team of ${firstCount} trainees averaged ${firstMean} points and a team of ${secondCount} trainees averaged ${secondMean} points. What was the combined average?`, explanation: `The teams scored ${firstCount} × ${firstMean} = ${firstCount * firstMean} and ${secondCount} × ${secondMean} = ${secondCount * secondMean} points. Divide the combined ${firstCount * firstMean + secondCount * secondMean} points by ${firstCount + secondCount} trainees: ${formatNumber(result)}.` }, "weighted-mean", { firstCount, secondCount, firstMean, secondMean }, result, optionResult, "points");
  }
  const known = Array.from({ length: 4 }, () => int(random, 12, 22) * 5);
  const knownTotal = known.reduce((sum, value) => sum + value, 0);
  const target = Math.ceil(((knownTotal + int(random, 8, 20) * 5) / 5) / 5) * 5;
  const result = target * 5 - known.reduce((sum, value) => sum + value, 0);
  const optionResult = numericOptions(result, [target * 4 - known.reduce((sum, value) => sum + value, 0), known.reduce((sum, value) => sum + value, 0) / 4, target], random, (value) => `${formatNumber(value)} sales`);
  return withAudit({ prompt: `Four weekly sales totals were ${known.join(", ")}. What must the fifth week's total be for the five-week mean to equal ${target}?`, explanation: `A mean of ${target} across five weeks requires ${target} × 5 = ${target * 5} total sales. The known weeks sum to ${known.reduce((sum, value) => sum + value, 0)}. The missing week is ${target * 5} − ${known.reduce((sum, value) => sum + value, 0)} = ${result} sales.` }, "missing-value-mean", { known, target }, result, optionResult, "sales");
}

function probabilityQuestion(random, difficulty) {
  const red = int(random, 2, 6);
  const yellow = int(random, 3, 7);
  const black = int(random, 1, 5);
  const total = red + yellow + black;
  if (difficulty === "foundation") {
    const result = yellow / total * 100;
    const optionResult = numericOptions(result, [red / total * 100, black / total * 100, (red + black) / total * 100], random, (value) => `${formatNumber(value)}%`, { min: 0, max: 100 });
    return withAudit({ prompt: `A sample contains ${red} red, ${yellow} yellow and ${black} black markers. If one is selected at random, what is the probability it is yellow?`, explanation: `There are ${total} markers and ${yellow} favourable outcomes. ${yellow} ÷ ${total} × 100 = ${formatNumber(result)}%.` }, "single-probability", { red, yellow, black }, result, optionResult, "percent");
  }
  if (difficulty === "standard") {
    const result = (red + yellow) / total * 100;
    const optionResult = numericOptions(result, [black / total * 100, yellow / total * 100, red / total * 100], random, (value) => `${formatNumber(value)}%`, { min: 0, max: 100 });
    return withAudit({ prompt: `A sample contains ${red} red, ${yellow} yellow and ${black} black markers. If one is selected at random, what is the probability it is not black?`, explanation: `There are ${red + yellow} non-black markers out of ${total}. ${red + yellow} ÷ ${total} × 100 = ${formatNumber(result)}%.` }, "complement-probability", { red, yellow, black }, result, optionResult, "percent");
  }
  const result = yellow / total * (yellow - 1) / (total - 1) * 100;
  const optionResult = numericOptions(result, [(yellow / total) ** 2 * 100, yellow / total * 100, (yellow - 1) / (total - 1) * 100], random, (value) => `${formatNumber(value)}%`, { min: 0, max: 100 });
  return withAudit({ prompt: `A sample contains ${red} red, ${yellow} yellow and ${black} black markers. Two are selected without replacement. What is the probability both are yellow?`, explanation: `The first-yellow probability is ${yellow}/${total}. Without replacement, the second is ${yellow - 1}/${total - 1}. Multiply: ${yellow}/${total} × ${yellow - 1}/${total - 1} × 100 = ${formatNumber(result)}%.` }, "without-replacement", { red, yellow, black }, result, optionResult, "percent");
}

const baseNumericalFactories = {
  percentages: percentageQuestion,
  ratios: ratioQuestion,
  currency: currencyQuestion,
  tables: tableQuestion,
  charts: chartQuestion,
  "profit-loss": profitQuestion,
  averages: averageQuestion,
  probability: probabilityQuestion,
};

const numericalFactories = Object.fromEntries(numericalTopics.map((topic) => [
  topic,
  (random, difficulty) => (random() < 0.5 ? baseNumericalFactories[topic] : alternateNumericalFactories[topic])(random, difficulty),
]));

export function recalculateNumericalAnswer(audit) {
  const input = audit.inputs;
  switch (audit.kind) {
    case "percentage-of-total": return round(input.total * input.rate / 100);
    case "discount-then-charge": return round(input.listPrice * (1 - input.discount / 100) * (1 + input.serviceRate / 100));
    case "reverse-percentage": return round(input.finalValue / (1 + input.growthRate / 100));
    case "percentage-increase": return round(input.base * (1 + input.firstRate / 100));
    case "percentage-decrease": return round(input.base * (1 - input.firstRate / 100));
    case "successive-percentages": return round(input.base * (1 + input.firstRate / 100) * (1 - input.secondRate / 100));
    case "ratio-share": return round(input.right * input.groups);
    case "three-part-ratio": return round(input.third * input.groups);
    case "ratio-after-change": return round((input.right * input.groups + input.added) / ((input.left + input.right) * input.groups + input.added) * 100);
    case "ratio-scale-known-part": return round(input.knownLeft / input.left * input.right);
    case "ratio-allocation-gap": return round((Math.max(input.left, input.right, input.third) - Math.min(input.left, input.right, input.third)) * input.groups);
    case "blended-ratios": return round((input.right * input.groupsOne + input.rightTwo * input.groupsTwo) / ((input.left + input.right) * input.groupsOne + (input.leftTwo + input.rightTwo) * input.groupsTwo) * 100);
    case "currency-conversion":
    case "currency-with-fee": return round(input.pounds * input.rate * (1 - input.fee / 100));
    case "currency-budget": return round(input.pounds * input.rate * (1 - input.fee / 100) - input.euroExpense);
    case "currency-reverse": return round(input.euros / input.rate);
    case "currency-reverse-with-fee": return round(input.euros / input.rate * (1 - input.fee / 100));
    case "currency-two-stage": return round(input.pounds * input.rate * (1 - input.euroFee / 100) * input.usdRate * (1 - input.usdFee / 100));
    case "table-difference": return round(input.rows[input.rowIndex].q2 - input.rows[input.rowIndex].q1);
    case "table-percentage-change": return round((input.rows[input.rowIndex].q2 - input.rows[input.rowIndex].q1) / input.rows[input.rowIndex].q1 * 100);
    case "table-combined-share": return round((input.rows[0].q2 + input.rows[2].q2) / input.rows.reduce((sum, item) => sum + item.q2, 0) * 100);
    case "table-column-total": return round(input.rows.reduce((sum, row) => sum + row[input.column], 0));
    case "table-total-percentage": {
      const planned = input.rows.reduce((sum, row) => sum + row.planned, 0);
      const actual = input.rows.reduce((sum, row) => sum + row.actual, 0);
      return round((actual - planned) / planned * 100);
    }
    case "table-missing-target": return round(input.targetTotal - input.rows.reduce((sum, row, index) => index === input.hiddenIndex ? sum : sum + row.actual, 0));
    case "chart-range": return round(Math.max(...input.values.map((item) => item.value)) - Math.min(...input.values.map((item) => item.value)));
    case "chart-mean": return round(input.values.reduce((sum, item) => sum + item.value, 0) / input.values.length);
    case "chart-percentage-change": return round((input.values[3].value - input.values[0].value) / input.values[0].value * 100);
    case "chart-pair-total": return round(input.values[input.firstIndex].value + input.values[input.secondIndex].value);
    case "chart-share-of-total": return round(input.values[input.selectedIndex].value / input.values.reduce((sum, item) => sum + item.value, 0) * 100);
    case "chart-required-average": return round(input.targetAverage * 5 - input.values.reduce((sum, item) => sum + item.value, 0));
    case "profit": return round(input.units * (input.price - input.variable) - input.fixed);
    case "profit-margin": {
      const profit = input.units * (input.price - input.variable) - input.fixed;
      return round(profit / (input.units * input.price) * 100);
    }
    case "profit-after-returns": return round(input.units * (1 - input.returnRate / 100) * input.price - input.units * input.variable - input.fixed);
    case "break-even-units": return round(input.fixed / (input.price - input.variable));
    case "profit-after-discount": return round(input.units * (input.listPrice * (1 - input.discount / 100) - input.variable) - input.fixed);
    case "blended-product-profit": return round(input.unitsA * (input.priceA - input.variableA) + input.unitsB * (input.priceB - input.variableB) - input.fixed);
    case "mean": return round(input.values.reduce((sum, value) => sum + value, 0) / input.values.length);
    case "weighted-mean": return round((input.firstCount * input.firstMean + input.secondCount * input.secondMean) / (input.firstCount + input.secondCount));
    case "missing-value-mean": return round(input.target * 5 - input.known.reduce((sum, value) => sum + value, 0));
    case "total-from-mean": return round(input.count * input.mean);
    case "mean-after-removal": return round((input.count * input.originalMean - input.removed) / (input.count - 1));
    case "required-group-mean": return round((input.targetMean * (input.firstCount + input.secondCount) - input.firstCount * input.firstMean) / input.secondCount);
    case "single-probability": return round(input.yellow / (input.red + input.yellow + input.black) * 100);
    case "complement-probability": return round((input.red + input.yellow) / (input.red + input.yellow + input.black) * 100);
    case "without-replacement": {
      const total = input.red + input.yellow + input.black;
      return round(input.yellow / total * (input.yellow - 1) / (total - 1) * 100);
    }
    case "not-red-probability": return round((input.yellow + input.black) / (input.red + input.yellow + input.black) * 100);
    case "with-replacement-probability": {
      const total = input.red + input.yellow + input.black;
      return round(input.yellow / total * input.yellow / total * 100);
    }
    case "at-least-one-probability": {
      const total = input.red + input.yellow + input.black;
      const nonYellow = total - input.yellow;
      return round((1 - nonYellow / total * (nonYellow - 1) / (total - 1)) * 100);
    }
    default: return Number.NaN;
  }
}

export function validateNumericalQuestion(question) {
  if (!question?.audit) return { valid: false, issues: ["Missing audit metadata"] };
  const issues = [];
  const recalculated = recalculateNumericalAnswer(question.audit);
  if (!Number.isFinite(recalculated)) issues.push("Recalculation is not finite");
  if (recalculated !== question.audit.correctValue) issues.push("Stored answer does not match independent recalculation");
  if (question.audit.optionValues[question.answer] !== question.audit.correctValue) issues.push("Answer index does not point to the correct value");
  if (new Set(question.audit.optionValues).size !== 4) issues.push("Numeric answer values are not unique");
  if (new Set(question.options).size !== 4) issues.push("Formatted answer choices are not unique");
  if (question.audit.optionValues.some((value) => !Number.isFinite(value))) issues.push("An answer choice is not finite");
  return { valid: issues.length === 0, issues };
}

export function createNumericalQuestion({ topic, difficulty = "standard", seed = Date.now() }) {
  if (!numericalFactories[topic]) throw new Error(`Unknown numerical topic: ${topic}`);
  if (!difficultySettings[difficulty]) throw new Error(`Unknown difficulty: ${difficulty}`);
  const random = seededRandom(seed);
  const generated = numericalFactories[topic](random, difficulty);
  return { id: `num-${topic}-${seed}`, category: "numerical", difficulty, topic, templateId: generated.audit.kind, ...generated };
}

function normaliseSelectionContext(selectionContext = {}) {
  return {
    recentQuestionIds: new Set(Array.isArray(selectionContext.recentQuestionIds) ? selectionContext.recentQuestionIds : []),
    recentPassageIds: new Set(Array.isArray(selectionContext.recentPassageIds) ? selectionContext.recentPassageIds : []),
    recentTemplateIds: new Set(Array.isArray(selectionContext.recentTemplateIds) ? selectionContext.recentTemplateIds : []),
    weakTopics: new Set(Array.isArray(selectionContext.weakTopics) ? selectionContext.weakTopics : []),
    unansweredTopics: new Set(Array.isArray(selectionContext.unansweredTopics) ? selectionContext.unansweredTopics : []),
  };
}

function topicPriority(topic, context) {
  return (context.unansweredTopics.has(topic) ? 2 : 0) + (context.weakTopics.has(topic) ? 1 : 0);
}

function createNumericalQuestions({ count, difficulty, random, selectionContext }) {
  const context = normaliseSelectionContext(selectionContext);
  const topics = shuffle(numericalTopics, random).sort((left, right) => topicPriority(right, context) - topicPriority(left, context));
  const selectedTemplates = new Set();
  return Array.from({ length: count }, (_, index) => {
    const topic = topics[index % topics.length];
    let generated = null;
    let fallback = null;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = numericalFactories[topic](random, difficulty);
      fallback ||= candidate;
      if (!context.recentTemplateIds.has(candidate.audit.kind) && !selectedTemplates.has(candidate.audit.kind)) {
        generated = candidate;
        break;
      }
    }
    generated ||= fallback;
    selectedTemplates.add(generated.audit.kind);
    return { id: `num-${topic}-${index}-${Math.round(random() * 100000)}`, category: "numerical", difficulty, topic, templateId: generated.audit.kind, ...generated };
  });
}

function normaliseStoredItem(item, category) {
  const options = category === "verbal" ? verbalOptions : category === "situational" ? item.options.map((option) => option.text) : item.options;
  const answer = category === "situational" ? item.options.reduce((best, option, index, list) => option.score > list[best].score ? index : best, 0) : item.answer;
  const passageId = category === "verbal" ? item.passageId || item.id.replace(/-\d+$/, "") : undefined;
  return { ...item, category, options, answer, ...(passageId ? { passageId } : {}), ...(category === "situational" ? { optionDetails: item.options } : {}) };
}

function selectAuthoredItems(items, count, random, selectionContext) {
  const context = normaliseSelectionContext(selectionContext);
  const ranked = shuffle(items, random).sort((left, right) => {
    const leftPassage = left.passageId || left.id.replace(/-\d+$/, "");
    const rightPassage = right.passageId || right.id.replace(/-\d+$/, "");
    const score = (item, passageId) =>
      (context.recentQuestionIds.has(item.id) ? 0 : 100)
      + (context.recentPassageIds.has(passageId) ? 0 : 35)
      + (context.unansweredTopics.has(item.topic) ? 25 : 0)
      + (context.weakTopics.has(item.topic) ? 15 : 0);
    return score(right, rightPassage) - score(left, leftPassage);
  });
  const selected = [];
  const passages = new Set();
  for (const item of ranked) {
    const passageId = item.passageId || item.id.replace(/-\d+$/, "");
    if (item.passage && passages.has(passageId)) continue;
    selected.push(item);
    if (item.passage) passages.add(passageId);
    if (selected.length === count) break;
  }
  if (selected.length < count) {
    for (const item of ranked) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length === count) break;
    }
  }
  return selected;
}

export function availableQuestionCounts(category, difficulty = "standard", pack = graduateCorePack) {
  if (category === "numerical") return [4, 6, 8];
  const available = pack.categories[category]?.items?.filter((item) => item.difficulty === difficulty).length || 0;
  return [2, 4, 6, 8].filter((count) => count <= available);
}

export function createPracticeSession({ category, difficulty = "standard", count = 6, seed = Date.now(), pack = graduateCorePack, selectionContext = {} }) {
  if (!difficultySettings[difficulty]) throw new Error(`Unknown difficulty: ${difficulty}`);
  const random = seededRandom(seed);
  const requestedCount = Math.max(1, Math.min(Number(count) || 6, 12));
  if (category === "numerical") return createNumericalQuestions({ count: requestedCount, difficulty, random, selectionContext });
  const source = pack.categories[category]?.items;
  if (!source) throw new Error(`Unknown assessment category: ${category}`);
  const matching = source.filter((item) => item.difficulty === difficulty);
  if (!matching.length) throw new Error(`No ${difficulty} questions are available for ${category}`);
  const safeCount = Math.min(requestedCount, matching.length);
  return selectAuthoredItems(matching, safeCount, random, selectionContext).map((item) => normaliseStoredItem(item, category));
}

export function describePattern(pattern) {
  const count = Math.max(1, Math.min(Number(pattern?.count) || 1, 4));
  const number = ["one", "two", "three", "four"][count - 1];
  const fill = pattern?.filled ? "solid" : "outline";
  const shape = `${pattern?.shape || "shape"}${count === 1 ? "" : "s"}`;
  const rotation = Number(pattern?.rotation) || 0;
  const corners = ["top left", "top right", "bottom right", "bottom left"];
  const marker = pattern?.accent === undefined ? "" : `, with a yellow marker at the ${corners[pattern.accent] || "top left"}`;
  return `${number} ${fill} ${shape}, rotated ${rotation} degrees${marker}`;
}

export function isCorrectAnswer(question, selected) {
  return Number(selected) === Number(question.answer);
}

export function questionRationale(question, optionIndex) {
  if (question.category !== "situational") return question.explanation;
  return question.optionDetails?.[optionIndex]?.rationale || question.explanation || "Review the impact, proportionality and stakeholders affected.";
}
