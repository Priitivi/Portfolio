import { describePattern } from "./questions.js";

const difficulties = ["foundation", "standard", "advanced"];

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function difficultyCounts(items) {
  return Object.fromEntries(difficulties.map((difficulty) => [difficulty, items.filter((item) => item.difficulty === difficulty).length]));
}

export function contentInventory(pack) {
  const inventory = {};
  for (const [category, config] of Object.entries(pack.categories)) {
    const items = config.items || [];
    inventory[category] = {
      items: items.length,
      difficulties: difficultyCounts(items),
      topics: [...new Set(items.map((item) => item.topic || item.competency).filter(Boolean))].length,
      ...(category === "verbal" ? { passages: new Set(items.map((item) => item.passageId || item.id.replace(/-\d+$/, ""))).size } : {}),
      ...(category === "numerical" ? { topics: config.topics?.length || 0 } : {}),
    };
  }
  return inventory;
}

export function validateContentPack(pack, minimums = { verbal: 40, logical: 30, situational: 30, interview: 75 }) {
  const issues = [];
  const allItems = Object.values(pack.categories).flatMap((config) => config.items || []);
  const ids = new Set();
  for (const item of allItems) {
    if (!item.id || ids.has(item.id)) issues.push(`Duplicate or missing item id: ${item.id || "<missing>"}`);
    ids.add(item.id);
    if (!difficulties.includes(item.difficulty)) issues.push(`${item.id} has an invalid difficulty`);
  }

  const verbal = pack.categories.verbal?.items || [];
  const passageTextToId = new Map();
  const passageIdToText = new Map();
  for (const item of verbal) {
    const passageId = item.passageId || item.id.replace(/-\d+$/, "");
    const priorId = passageTextToId.get(item.passage);
    const priorText = passageIdToText.get(passageId);
    if (priorId && priorId !== passageId) issues.push(`Duplicate passage text under different ids: ${priorId}/${passageId}`);
    if (priorText && priorText !== item.passage) issues.push(`Passage id ${passageId} is reused for different text`);
    passageTextToId.set(item.passage, passageId);
    passageIdToText.set(passageId, item.passage);
    if (![0, 1, 2].includes(item.answer)) issues.push(`${item.id} has an invalid verbal answer`);
    if (wordCount(item.passage) < 30) issues.push(`${item.id} has a passage that is too shallow for evidence-based inference`);
    if (wordCount(item.statement) < 5) issues.push(`${item.id} has an underspecified verbal statement`);
    if (wordCount(item.explanation) < 10) issues.push(`${item.id} is missing a detailed verbal rationale`);
  }

  const logical = pack.categories.logical?.items || [];
  for (const item of logical) {
    const descriptions = item.options?.map(describePattern) || [];
    if (descriptions.length !== 4 || new Set(descriptions).size !== descriptions.length) issues.push(`${item.id} has repeated logical options`);
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= descriptions.length) issues.push(`${item.id} has an invalid logical answer`);
    if (wordCount(item.prompt) < 4) issues.push(`${item.id} has an underspecified logical prompt`);
    if (wordCount(item.explanation) < 12) issues.push(`${item.id} is missing a detailed logical rule explanation`);
    if ([...(item.sequence || []), ...(item.options || [])].some((pattern) => !describePattern(pattern)?.trim())) issues.push(`${item.id} is missing an accessible pattern description`);
  }

  const situational = pack.categories.situational?.items || [];
  for (const item of situational) {
    const scores = item.options?.map((option) => option.score) || [];
    if (scores.length !== 4 || [...scores].sort((left, right) => right - left).join(",") !== "4,3,2,1") issues.push(`${item.id} has an invalid educational ranking`);
    if (new Set(item.options?.map((option) => option.text)).size !== 4) issues.push(`${item.id} has repeated situational responses`);
    if (wordCount(item.scenario) < 25 || wordCount(item.prompt) < 4) issues.push(`${item.id} has an underspecified workplace scenario`);
    if (item.options?.some((option) => wordCount(option.text) < 9)) issues.push(`${item.id} has an underspecified situational response`);
    if (item.options?.some((option) => wordCount(option.rationale) < 8)) issues.push(`${item.id} is missing a detailed response rationale`);
  }

  const interview = pack.categories.interview?.items || [];
  for (const item of interview) {
    const hasCoaching = wordCount(item.question) >= 8
      && Array.isArray(item.probes) && item.probes.length >= 2 && item.probes.every((probe) => wordCount(probe) >= 2)
      && wordCount(item.recommendedStructure) >= 2
      && wordCount(item.preparationCue) >= 2
      && Array.isArray(item.followUps) && item.followUps.length >= 2 && item.followUps.every((prompt) => wordCount(prompt) >= 3);
    if (!hasCoaching) issues.push(`${item.id} is missing substantive interview coaching metadata`);
  }

  const authoredText = JSON.stringify({ verbal, logical, situational, interview });
  if (/\b(?:SHL|SOVA|Cappfinity|Arctic Shores|Aon|TestGorilla|Mercer Mettl|Korn Ferry)\b/i.test(authoredText)) issues.push("Authored content contains assessment-provider branding");

  for (const [category, minimum] of Object.entries(minimums)) {
    const items = pack.categories[category]?.items || [];
    if (items.length < minimum) issues.push(`${category} has ${items.length} items; expected at least ${minimum}`);
    const counts = difficultyCounts(items);
    const spread = Math.max(...Object.values(counts)) - Math.min(...Object.values(counts));
    if (spread > Math.ceil(items.length * 0.12)) issues.push(`${category} has an unbalanced difficulty distribution`);
  }

  return { valid: issues.length === 0, issues, inventory: contentInventory(pack) };
}
