function int(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
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

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = int(random, 0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function numericOptions(correctValue, distractors, random, formatter = (value) => formatNumber(value), bounds = {}) {
  const correct = round(correctValue);
  const minimum = bounds.min ?? Number.NEGATIVE_INFINITY;
  const maximum = bounds.max ?? Number.POSITIVE_INFINITY;
  const values = [];
  const displays = new Set();
  for (const candidate of [correct, ...distractors.map((value) => round(value))]) {
    if (!Number.isFinite(candidate) || candidate < minimum || candidate > maximum) continue;
    const display = formatter(candidate);
    if (values.includes(candidate) || displays.has(display)) continue;
    values.push(candidate);
    displays.add(display);
  }
  const offset = Math.max(1, Math.abs(correct) * 0.1);
  for (let attempt = 1; values.length < 4 && attempt < 1000; attempt += 1) {
    const direction = attempt % 2 ? 1 : -1;
    const candidate = round(correct + direction * offset * Math.ceil(attempt / 2));
    const display = formatter(candidate);
    if (candidate >= minimum && candidate <= maximum && !values.includes(candidate) && !displays.has(display)) {
      values.push(candidate);
      displays.add(display);
    }
  }
  if (values.length < 4) throw new Error("Unable to create four unique expanded numerical choices");
  const optionValues = shuffle(values.slice(0, 4), random);
  return { options: optionValues.map(formatter), optionValues, answer: optionValues.indexOf(correct) };
}

function withAudit(question, kind, inputs, correctValue, options, unit) {
  return {
    ...question,
    options: options.options,
    answer: options.answer,
    audit: { kind, inputs, correctValue: round(correctValue), optionValues: options.optionValues, unit },
  };
}

function percentageAlternative(random, difficulty) {
  if (difficulty === "foundation") {
    const total = int(random, 8, 30) * 20;
    const rate = int(random, 2, 8) * 5;
    const result = total * rate / 100;
    const options = numericOptions(result, [total * (1 + rate / 100), total - result, rate], random, (value) => `${formatNumber(value)} responses`);
    return withAudit({ prompt: `${rate}% of ${total} survey responses requested a follow-up. How many responses requested one?`, explanation: `Convert ${rate}% to ${rate / 100} and multiply by ${total}: ${total} × ${rate / 100} = ${formatNumber(result)} responses.` }, "percentage-of-total", { total, rate }, result, options, "responses");
  }
  if (difficulty === "standard") {
    const listPrice = int(random, 8, 24) * 100;
    const discount = int(random, 2, 6) * 5;
    const serviceRate = int(random, 1, 4) * 5;
    const discounted = listPrice * (1 - discount / 100);
    const result = discounted * (1 + serviceRate / 100);
    const options = numericOptions(result, [listPrice * (1 - (discount - serviceRate) / 100), discounted, listPrice * (1 + serviceRate / 100)], random, (value) => money(value));
    return withAudit({ prompt: `A training package costs ${money(listPrice)}. A ${discount}% discount is applied, then a ${serviceRate}% service charge is added to the discounted price. What is the final cost?`, explanation: `After the discount: ${money(listPrice)} × ${(1 - discount / 100).toFixed(2)} = ${money(discounted)}. Apply the charge to that amount: ${money(discounted)} × ${(1 + serviceRate / 100).toFixed(2)} = ${money(result)}.` }, "discount-then-charge", { listPrice, discount, serviceRate }, result, options, "GBP");
  }
  const finalValue = int(random, 18, 48) * 25;
  const growthRate = int(random, 2, 7) * 5;
  const result = finalValue / (1 + growthRate / 100);
  const options = numericOptions(result, [finalValue * (1 - growthRate / 100), finalValue / (growthRate / 100), finalValue - growthRate], random, (value) => `${formatNumber(value)} subscriptions`);
  return withAudit({ prompt: `After increasing by ${growthRate}%, a service has ${finalValue} subscriptions. How many did it have immediately before the increase?`, explanation: `${finalValue} represents ${100 + growthRate}% of the original. Divide by ${(1 + growthRate / 100).toFixed(2)}: ${finalValue} ÷ ${(1 + growthRate / 100).toFixed(2)} = ${formatNumber(result)} subscriptions.` }, "reverse-percentage", { finalValue, growthRate }, result, options, "subscriptions");
}

function ratioAlternative(random, difficulty) {
  const left = int(random, 2, 5);
  const right = int(random, 3, 8);
  if (difficulty === "foundation") {
    const knownLeft = left * int(random, 4, 10);
    const result = knownLeft / left * right;
    const options = numericOptions(result, [knownLeft / right * left, knownLeft + right, knownLeft * (left + right)], random, (value) => `${formatNumber(value, 0)} files`);
    return withAudit({ prompt: `Reviewed and pending files are in the ratio ${left}:${right}. If ${knownLeft} are reviewed, how many are pending?`, explanation: `Each ratio part is ${knownLeft} ÷ ${left} = ${knownLeft / left}. Pending files use ${right} parts: ${knownLeft / left} × ${right} = ${result}.` }, "ratio-scale-known-part", { left, right, knownLeft }, result, options, "files");
  }
  if (difficulty === "standard") {
    const third = int(random, 2, 6);
    const groups = int(random, 5, 11);
    const result = (Math.max(left, right, third) - Math.min(left, right, third)) * groups;
    const total = (left + right + third) * groups;
    const options = numericOptions(result, [Math.max(left, right, third) * groups, Math.min(left, right, third) * groups, total / 3], random, (value) => `${formatNumber(value, 0)} hours`);
    return withAudit({ prompt: `A ${total}-hour plan divides discovery, delivery and testing in the ratio ${left}:${right}:${third}. What is the difference between the largest and smallest allocations?`, explanation: `One part is ${groups} hours. The ratio-part difference is ${Math.max(left, right, third) - Math.min(left, right, third)}, so the allocation difference is ${result} hours.` }, "ratio-allocation-gap", { left, right, third, groups }, result, options, "hours");
  }
  const leftTwo = int(random, 1, 4);
  const rightTwo = int(random, 4, 8);
  const groupsOne = int(random, 3, 8);
  const groupsTwo = int(random, 3, 8);
  const combinedRight = right * groupsOne + rightTwo * groupsTwo;
  const combinedTotal = (left + right) * groupsOne + (leftTwo + rightTwo) * groupsTwo;
  const result = combinedRight / combinedTotal * 100;
  const options = numericOptions(result, [right / (left + right) * 100, rightTwo / (leftTwo + rightTwo) * 100, combinedRight / ((left + right) * groupsOne) * 100], random, (value) => `${formatNumber(value)}%`);
  return withAudit({ prompt: `Team A has researchers and engineers in the ratio ${left}:${right} across ${(left + right) * groupsOne} people. Team B has the ratio ${leftTwo}:${rightTwo} across ${(leftTwo + rightTwo) * groupsTwo}. What percentage of both teams are engineers?`, explanation: `Team A has ${right * groupsOne} engineers and Team B has ${rightTwo * groupsTwo}. Together that is ${combinedRight} of ${combinedTotal}: ${combinedRight} ÷ ${combinedTotal} × 100 = ${formatNumber(result)}%.` }, "blended-ratios", { left, right, leftTwo, rightTwo, groupsOne, groupsTwo }, result, options, "percent");
}

function currencyAlternative(random, difficulty) {
  const rate = [1.11, 1.17, 1.23, 1.28][int(random, 0, 3)];
  if (difficulty === "foundation") {
    const euros = int(random, 10, 35) * 100;
    const result = euros / rate;
    const options = numericOptions(result, [euros * rate, euros - rate, euros / (rate + 0.1)], random, (value) => money(value));
    return withAudit({ prompt: `An invoice is ${money(euros, "€")} and the rate is £1 = €${rate.toFixed(2)}. What is its value in pounds?`, explanation: `The quote gives euros for each pound, so divide: ${money(euros, "€")} ÷ ${rate.toFixed(2)} = ${money(result)}.` }, "currency-reverse", { euros, rate }, result, options, "GBP");
  }
  if (difficulty === "standard") {
    const euros = int(random, 12, 32) * 100;
    const fee = int(random, 1, 3);
    const beforeFee = euros / rate;
    const result = beforeFee * (1 - fee / 100);
    const options = numericOptions(result, [euros * rate * (1 - fee / 100), beforeFee, beforeFee * (1 + fee / 100)], random, (value) => money(value));
    return withAudit({ prompt: `${money(euros, "€")} is converted at £1 = €${rate.toFixed(2)}, then a ${fee}% fee is deducted from the pound amount. How many pounds remain?`, explanation: `Convert by dividing: ${money(euros, "€")} ÷ ${rate.toFixed(2)} = ${money(beforeFee)}. Keep ${100 - fee}%: ${money(beforeFee)} × ${(1 - fee / 100).toFixed(2)} = ${money(result)}.` }, "currency-reverse-with-fee", { euros, rate, fee }, result, options, "GBP");
  }
  const pounds = int(random, 12, 30) * 100;
  const euroFee = int(random, 1, 3);
  const usdRate = [1.04, 1.08, 1.12, 1.15][int(random, 0, 3)];
  const usdFee = int(random, 1, 2);
  const eurosAfterFee = pounds * rate * (1 - euroFee / 100);
  const result = eurosAfterFee * usdRate * (1 - usdFee / 100);
  const options = numericOptions(result, [pounds * rate * usdRate, eurosAfterFee * usdRate, pounds / rate * usdRate * (1 - usdFee / 100)], random, (value) => money(value, "$"));
  return withAudit({ prompt: `${money(pounds)} is converted to euros at £1 = €${rate.toFixed(2)} with a ${euroFee}% fee, then to dollars at €1 = $${usdRate.toFixed(2)} with a ${usdFee}% fee. How many dollars remain?`, explanation: `First: ${money(pounds)} × ${rate.toFixed(2)} × ${(1 - euroFee / 100).toFixed(2)} = ${money(eurosAfterFee, "€")}. Then: ${money(eurosAfterFee, "€")} × ${usdRate.toFixed(2)} × ${(1 - usdFee / 100).toFixed(2)} = ${money(result, "$")}.` }, "currency-two-stage", { pounds, rate, euroFee, usdRate, usdFee }, result, options, "USD");
}

function tableAlternative(random, difficulty) {
  const rows = [
    { label: "North", planned: int(random, 42, 58), actual: int(random, 48, 68) },
    { label: "Central", planned: int(random, 36, 52), actual: int(random, 44, 64) },
    { label: "South", planned: int(random, 45, 61), actual: int(random, 52, 72) },
  ];
  if (difficulty === "foundation") {
    const column = random() < 0.5 ? "planned" : "actual";
    const result = rows.reduce((sum, row) => sum + row[column], 0);
    const context = { type: "table", title: "Regional onboarding cases", columns: ["Region", "Planned", "Actual"], rows: rows.map((row) => [row.label, row.planned, row.actual]) };
    const options = numericOptions(result, [rows[0][column] + rows[1][column], result / 3, rows.reduce((sum, row) => sum + row[column === "planned" ? "actual" : "planned"], 0)], random, (value) => `${formatNumber(value, 0)} cases`);
    return withAudit({ prompt: `What is the total ${column} number of cases across all three regions?`, context, explanation: `Add the ${column} column: ${rows.map((row) => row[column]).join(" + ")} = ${result} cases.` }, "table-column-total", { rows, column }, result, options, "cases");
  }
  if (difficulty === "standard") {
    const plannedTotal = rows.reduce((sum, row) => sum + row.planned, 0);
    const generatedActualTotal = rows.reduce((sum, row) => sum + row.actual, 0);
    if (generatedActualTotal <= plannedTotal) rows[2].actual += plannedTotal - generatedActualTotal + int(random, 3, 12);
    const actualTotal = rows.reduce((sum, row) => sum + row.actual, 0);
    const result = (actualTotal - plannedTotal) / plannedTotal * 100;
    const context = { type: "table", title: "Regional onboarding cases", columns: ["Region", "Planned", "Actual"], rows: rows.map((row) => [row.label, row.planned, row.actual]) };
    const options = numericOptions(result, [(actualTotal - plannedTotal) / actualTotal * 100, actualTotal / plannedTotal * 100, actualTotal - plannedTotal], random, (value) => `${formatNumber(value)}%`);
    return withAudit({ prompt: "By what percentage did total actual cases exceed total planned cases?", context, explanation: `Planned cases total ${plannedTotal}; actual cases total ${actualTotal}. Divide the ${actualTotal - plannedTotal} increase by ${plannedTotal}: ${formatNumber(result)}%.` }, "table-total-percentage", { rows }, result, options, "percent");
  }
  const targetTotal = rows.reduce((sum, row) => sum + row.actual, 0) + int(random, 12, 28);
  const hiddenIndex = int(random, 0, rows.length - 1);
  const knownTotal = rows.reduce((sum, row, index) => index === hiddenIndex ? sum : sum + row.actual, 0);
  const result = targetTotal - knownTotal;
  const context = { type: "table", title: "Target onboarding cases", columns: ["Region", "Planned", "Required"], rows: rows.map((row, index) => [row.label, row.planned, index === hiddenIndex ? "?" : row.actual]) };
  const options = numericOptions(result, [targetTotal - rows.reduce((sum, row) => sum + row.planned, 0), targetTotal / 3, knownTotal], random, (value) => `${formatNumber(value, 0)} cases`);
  return withAudit({ prompt: `The required-column total must be ${targetTotal}. What value is missing for ${rows[hiddenIndex].label}?`, context, explanation: `Visible required values total ${knownTotal}. Subtract from ${targetTotal}: ${targetTotal} − ${knownTotal} = ${result} cases.` }, "table-missing-target", { rows, targetTotal, hiddenIndex }, result, options, "cases");
}

function chartAlternative(random, difficulty) {
  const values = ["Mon", "Tue", "Wed", "Thu"].map((label, index) => ({ label, value: int(random, 36 + index * 5, 52 + index * 7) }));
  const context = { type: "bars", title: "Applications checked per day", values };
  if (difficulty === "foundation") {
    const firstIndex = int(random, 0, 1);
    const secondIndex = firstIndex + 2;
    const result = values[firstIndex].value + values[secondIndex].value;
    const options = numericOptions(result, [values[firstIndex].value, values[secondIndex].value, Math.abs(values[firstIndex].value - values[secondIndex].value)], random, (value) => `${formatNumber(value, 0)} applications`);
    return withAudit({ prompt: `How many applications were checked on ${values[firstIndex].label} and ${values[secondIndex].label} combined?`, context, explanation: `Read the two bars and add them: ${values[firstIndex].value} + ${values[secondIndex].value} = ${result} applications.` }, "chart-pair-total", { values, firstIndex, secondIndex }, result, options, "applications");
  }
  if (difficulty === "standard") {
    const selectedIndex = int(random, 0, values.length - 1);
    const total = values.reduce((sum, item) => sum + item.value, 0);
    const result = values[selectedIndex].value / total * 100;
    const options = numericOptions(result, [values[selectedIndex].value / (total - values[selectedIndex].value) * 100, total / values[selectedIndex].value, values[selectedIndex].value], random, (value) => `${formatNumber(value)}%`);
    return withAudit({ prompt: `What percentage of the four-day total was checked on ${values[selectedIndex].label}?`, context, explanation: `The four-day total is ${total}. ${values[selectedIndex].label} contributes ${values[selectedIndex].value}: ${values[selectedIndex].value} ÷ ${total} × 100 = ${formatNumber(result)}%.` }, "chart-share-of-total", { values, selectedIndex }, result, options, "percent");
  }
  const currentTotal = values.reduce((sum, item) => sum + item.value, 0);
  const minimumMean = Math.ceil(currentTotal / 5);
  const targetAverage = Math.max(58, minimumMean + int(random, 5, 15));
  const result = targetAverage * 5 - currentTotal;
  const options = numericOptions(result, [targetAverage * 4 - currentTotal, targetAverage, currentTotal / 4], random, (value) => `${formatNumber(value)} applications`);
  return withAudit({ prompt: `How many applications must be checked on Friday for the five-day average to be ${targetAverage}?`, context, explanation: `A five-day average of ${targetAverage} needs ${targetAverage * 5} applications. Monday to Thursday total ${currentTotal}, so Friday needs ${targetAverage * 5} − ${currentTotal} = ${formatNumber(result)}.` }, "chart-required-average", { values, targetAverage }, result, options, "applications");
}

function profitAlternative(random, difficulty) {
  if (difficulty === "foundation") {
    const price = int(random, 24, 46);
    const variable = int(random, 8, price - 8);
    const contribution = price - variable;
    const breakEven = int(random, 4, 12) * 50;
    const fixed = contribution * breakEven;
    const options = numericOptions(breakEven, [fixed / price, fixed / variable, fixed], random, (value) => `${formatNumber(value, 0)} units`);
    return withAudit({ prompt: `A package sells for ${money(price)} with variable cost ${money(variable)} and fixed cost ${money(fixed)}. How many units must be sold to break even?`, explanation: `Contribution is ${money(price)} − ${money(variable)} = ${money(contribution)} per unit. Break-even units are ${money(fixed)} ÷ ${money(contribution)} = ${breakEven}.` }, "break-even-units", { price, variable, fixed }, breakEven, options, "units");
  }
  if (difficulty === "standard") {
    const units = int(random, 8, 18) * 100;
    const listPrice = int(random, 28, 46);
    const discount = int(random, 1, 4) * 5;
    const variable = int(random, 10, 18);
    const fixed = int(random, 4, 9) * 1000;
    const salePrice = listPrice * (1 - discount / 100);
    const result = units * (salePrice - variable) - fixed;
    const options = numericOptions(result, [units * (listPrice - variable) - fixed, units * salePrice - fixed, units * (salePrice - variable)], random, (value) => money(value));
    return withAudit({ prompt: `${formatNumber(units, 0)} units sell at a ${discount}% discount to ${money(listPrice)}. Variable cost is ${money(variable)} and fixed cost is ${money(fixed)}. What is profit?`, explanation: `Sale price is ${money(listPrice)} × ${(1 - discount / 100).toFixed(2)} = ${money(salePrice)}. Contribution is ${money(salePrice - variable)} per unit; subtract fixed cost from ${money(units * (salePrice - variable))} to get ${money(result)}.` }, "profit-after-discount", { units, listPrice, discount, variable, fixed }, result, options, "GBP");
  }
  const unitsA = int(random, 4, 10) * 100;
  const unitsB = int(random, 3, 9) * 100;
  const priceA = int(random, 24, 38);
  const priceB = int(random, 38, 58);
  const variableA = int(random, 8, 16);
  const variableB = int(random, 14, 24);
  const fixed = int(random, 8, 15) * 1000;
  const result = unitsA * (priceA - variableA) + unitsB * (priceB - variableB) - fixed;
  const options = numericOptions(result, [unitsA * priceA + unitsB * priceB - fixed, unitsA * (priceA - variableA) + unitsB * (priceB - variableB), result + fixed], random, (value) => money(value));
  return withAudit({ prompt: `Product A sells ${unitsA} units at ${money(priceA)} with ${money(variableA)} variable cost. Product B sells ${unitsB} at ${money(priceB)} with ${money(variableB)} variable cost. Shared fixed cost is ${money(fixed)}. What is total profit?`, explanation: `A contributes ${money(unitsA * (priceA - variableA))}; B contributes ${money(unitsB * (priceB - variableB))}. Subtract ${money(fixed)} shared fixed cost to get ${money(result)}.` }, "blended-product-profit", { unitsA, unitsB, priceA, priceB, variableA, variableB, fixed }, result, options, "GBP");
}

function averageAlternative(random, difficulty) {
  if (difficulty === "foundation") {
    const count = int(random, 4, 8);
    const mean = int(random, 18, 42);
    const result = count * mean;
    const options = numericOptions(result, [mean, result / count + mean, result - mean], random, (value) => `${formatNumber(value, 0)} tasks`);
    return withAudit({ prompt: `${count} teams completed an average of ${mean} tasks each. How many tasks did they complete in total?`, explanation: `Total equals count multiplied by mean: ${count} × ${mean} = ${result} tasks.` }, "total-from-mean", { count, mean }, result, options, "tasks");
  }
  if (difficulty === "standard") {
    const count = int(random, 5, 9);
    const originalMean = int(random, 48, 72);
    const removed = int(random, 30, originalMean - 5);
    const result = (count * originalMean - removed) / (count - 1);
    const options = numericOptions(result, [originalMean, (count * originalMean - removed) / count, originalMean - removed / count], random, (value) => `${formatNumber(value)} points`);
    return withAudit({ prompt: `${count} scores have a mean of ${originalMean}. The lowest score, ${removed}, is removed. What is the mean of the remaining scores?`, explanation: `The original total is ${count} × ${originalMean} = ${count * originalMean}. Remove ${removed} and divide ${count * originalMean - removed} by ${count - 1}: ${formatNumber(result)} points.` }, "mean-after-removal", { count, originalMean, removed }, result, options, "points");
  }
  const firstCount = int(random, 4, 8);
  const secondCount = int(random, 3, 7);
  const firstMean = int(random, 45, 65);
  const targetMean = firstMean + int(random, 8, 18);
  const result = (targetMean * (firstCount + secondCount) - firstCount * firstMean) / secondCount;
  const options = numericOptions(result, [(targetMean * (firstCount + secondCount) - firstMean) / secondCount, targetMean, (targetMean + firstMean) / 2], random, (value) => `${formatNumber(value)} points`);
  return withAudit({ prompt: `A group of ${firstCount} trainees averages ${firstMean}. What average must a second group of ${secondCount} achieve for the combined mean to be ${targetMean}?`, explanation: `The combined total must be ${targetMean * (firstCount + secondCount)}. The first group contributes ${firstCount * firstMean}, leaving ${targetMean * (firstCount + secondCount) - firstCount * firstMean} across ${secondCount} people: ${formatNumber(result)}.` }, "required-group-mean", { firstCount, secondCount, firstMean, targetMean }, result, options, "points");
}

function probabilityAlternative(random, difficulty) {
  const red = int(random, 2, 6);
  const yellow = int(random, 3, 8);
  const black = int(random, 2, 6);
  const total = red + yellow + black;
  if (difficulty === "foundation") {
    const result = (yellow + black) / total * 100;
    const options = numericOptions(result, [red / total * 100, yellow / total * 100, black / total * 100], random, (value) => `${formatNumber(value)}%`, { min: 0, max: 100 });
    return withAudit({ prompt: `A box holds ${red} red, ${yellow} yellow and ${black} black cards. What is the probability of selecting a card that is not red?`, explanation: `There are ${yellow + black} non-red cards out of ${total}. ${yellow + black} ÷ ${total} × 100 = ${formatNumber(result)}%.` }, "not-red-probability", { red, yellow, black }, result, options, "percent");
  }
  if (difficulty === "standard") {
    const result = yellow / total * yellow / total * 100;
    const options = numericOptions(result, [yellow / total * (yellow - 1) / (total - 1) * 100, yellow / total * 100, (yellow + yellow) / total * 100], random, (value) => `${formatNumber(value)}%`, { min: 0, max: 100 });
    return withAudit({ prompt: `A box holds ${red} red, ${yellow} yellow and ${black} black cards. One card is selected, replaced, and a second is selected. What is the probability both are yellow?`, explanation: `Replacement keeps the probability at ${yellow}/${total} on both draws. Multiply ${yellow}/${total} × ${yellow}/${total} × 100 = ${formatNumber(result)}%.` }, "with-replacement-probability", { red, yellow, black }, result, options, "percent");
  }
  const nonYellow = total - yellow;
  const noYellow = nonYellow / total * (nonYellow - 1) / (total - 1);
  const result = (1 - noYellow) * 100;
  const options = numericOptions(result, [yellow / total * 100, yellow / total * (yellow - 1) / (total - 1) * 100, noYellow * 100], random, (value) => `${formatNumber(value)}%`, { min: 0, max: 100 });
  return withAudit({ prompt: `A box holds ${red} red, ${yellow} yellow and ${black} black cards. Two are selected without replacement. What is the probability at least one is yellow?`, explanation: `The probability of no yellow is ${nonYellow}/${total} × ${nonYellow - 1}/${total - 1} = ${formatNumber(noYellow * 100)}%. The complement is 100% − ${formatNumber(noYellow * 100)}% = ${formatNumber(result)}%.` }, "at-least-one-probability", { red, yellow, black }, result, options, "percent");
}

export const alternateNumericalFactories = {
  percentages: percentageAlternative,
  ratios: ratioAlternative,
  currency: currencyAlternative,
  tables: tableAlternative,
  charts: chartAlternative,
  "profit-loss": profitAlternative,
  averages: averageAlternative,
  probability: probabilityAlternative,
};
