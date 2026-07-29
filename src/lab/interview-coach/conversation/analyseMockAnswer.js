import { normaliseInput } from "./normaliseInput.js";

const DIMENSION_PATTERNS = {
  concreteExample: [
    /\bfor example\b/,
    /\ba specific example\b/,
    /\ba time when\b/,
    /\bwhen i\b/,
    /\bin my role at\b/,
    /\bduring (?:a|the) \w+ (?:project|session|role)\b/,
  ],
  situation: [
    /\bthe situation\b/,
    /\bthe context\b/,
    /\bwe needed to\b/,
    /\bthe challenge was\b/,
    /\bthe client\b/,
    /\bthe project\b/,
    /\bthe school\b/,
  ],
  personalAction: [
    /\bi (?:asked|adapted|analysed|analyzed|built|checked|clarified|communicated|coordinated|created|decided|delivered|designed|documented|explained|identified|led|managed|organised|organized|planned|prioritised|prioritized|raised|reviewed|resolved|tested|trained|updated|worked)\b/,
    /\bmy responsibility\b/,
    /\bmy role was\b/,
    /\bi was responsible\b/,
  ],
  result: [
    /\bas a result\b/,
    /\bthe result\b/,
    /\bthe outcome\b/,
    /\bthis led to\b/,
    /\bwhich meant\b/,
    /\bimproved\b/,
    /\bincreased\b/,
    /\breduced\b/,
    /\bcompleted\b/,
    /\bmet the deadline\b/,
  ],
  customerFocus: [
    /\bcustomer\b/,
    /\bclient\b/,
    /\buser need\b/,
    /\bquery\b/,
    /\badoption\b/,
    /\brelationship\b/,
  ],
  learnerFocus: [
    /\blearner\b/,
    /\baudience\b/,
    /\bpupil\b/,
    /\bstudent\b/,
    /\bunderstanding\b/,
    /\bprior knowledge\b/,
    /\baccessible\b/,
    /\bconfidence\b/,
  ],
  collaboration: [
    /\bstakeholder\b/,
    /\bsubject matter expert\b/,
    /\bsme\b/,
    /\bcross functional\b/,
    /\bteam\b/,
    /\bcolleague\b/,
    /\btogether\b/,
    /\bworked with\b/,
  ],
  challenge: [
    /\bchallenge\b/,
    /\bblocker\b/,
    /\brisk\b/,
    /\bdifficulty\b/,
    /\bconflict\b/,
    /\btrade off\b/,
    /\bconstraint\b/,
    /\bproblem\b/,
  ],
  reflection: [
    /\bi learned\b/,
    /\bi learnt\b/,
    /\bnext time\b/,
    /\bi would\b/,
    /\bafter reflecting\b/,
    /\bfeedback showed\b/,
    /\bcarried forward\b/,
  ],
  measurableEvidence: [
    /\b\d+(?:\.\d+)?%?\b/,
    /\bfeedback\b/,
    /\bmetric\b/,
    /\bmeasured\b/,
    /\bdeadline\b/,
    /\bmilestone\b/,
    /\bcompletion\b/,
    /\badoption\b/,
    /\bsupport tickets?\b/,
  ],
  roleRelevance: [
    /\btraining\b/,
    /\blearning\b/,
    /\bcontent\b/,
    /\bproject\b/,
    /\bproduct\b/,
    /\bcustomer\b/,
    /\bstakeholder\b/,
    /\bsoftware\b/,
    /\bprocess\b/,
    /\baccessib/,
  ],
};

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

export function analyseMockAnswer(answer) {
  const normalised = normaliseInput(answer);
  const text = normalised.expanded;
  const wordCount = normalised.tokens.length;
  const sentenceCount = String(answer)
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .length;
  const dimensions = Object.fromEntries(
    Object.entries(DIMENSION_PATTERNS).map(([id, patterns]) => [id, matchesAny(text, patterns)]),
  );

  dimensions.clarity = wordCount >= 22
    && (sentenceCount >= 2 || /\b(first|then|because|so|finally)\b/.test(text));
  dimensions.specificEvidence = dimensions.concreteExample
    && dimensions.personalAction
    && (dimensions.result || dimensions.measurableEvidence);
  dimensions.audienceImpact = dimensions.customerFocus || dimensions.learnerFocus;

  return {
    wordCount,
    sentenceCount,
    dimensions,
    presentDimensions: Object.entries(dimensions)
      .filter(([, present]) => present)
      .map(([id]) => id),
    missingDimensions: Object.entries(dimensions)
      .filter(([, present]) => !present)
      .map(([id]) => id),
  };
}
