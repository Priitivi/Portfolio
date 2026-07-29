const CONTRACTIONS = new Map([
  ["aren't", "are not"],
  ["can't", "cannot"],
  ["couldn't", "could not"],
  ["didn't", "did not"],
  ["doesn't", "does not"],
  ["don't", "do not"],
  ["how's", "how is"],
  ["i'd", "i would"],
  ["i'll", "i will"],
  ["i'm", "i am"],
  ["i've", "i have"],
  ["isn't", "is not"],
  ["it's", "it is"],
  ["that's", "that is"],
  ["there's", "there is"],
  ["they're", "they are"],
  ["they've", "they have"],
  ["what's", "what is"],
  ["who's", "who is"],
  ["won't", "will not"],
  ["wouldn't", "would not"],
  ["you're", "you are"],
  ["you've", "you have"],
]);

const SPELLING_CORRECTIONS = new Map([
  ["acivation", "activation"],
  ["actiavte", "activate"],
  ["actiavtion", "activation"],
  ["availble", "available"],
  ["book nest", "booknest"],
  ["booknset", "booknest"],
  ["cancellaton", "cancellation"],
  ["clarfication", "clarification"],
  ["communcation", "communication"],
  ["confussion", "confusion"],
  ["custmer", "customer"],
  ["custmers", "customers"],
  ["elaberate", "elaborate"],
  ["elborate", "elaborate"],
  ["enviroment", "environment"],
  ["exaplain", "explain"],
  ["funtion", "function"],
  ["meassure", "measure"],
  ["notifcation", "notification"],
  ["recieve", "receive"],
  ["repsonse", "response"],
  ["responibilities", "responsibilities"],
  ["responsibilites", "responsibilities"],
  ["responsiblities", "responsibilities"],
  ["reviw", "review"],
  ["rong", "wrong"],
  ["signof", "signoff"],
  ["smart re-book", "smart rebook"],
  ["smartrebook", "smart rebook"],
  ["sucess", "success"],
  ["sucsess", "success"],
  ["succesful", "successful"],
  ["triger", "trigger"],
  ["trigers", "triggers"],
  ["wait list", "waitlist"],
  ["wait lists", "waitlist"],
  ["wait-list", "waitlist"],
  ["wait-lists", "waitlist"],
]);

const LANGUAGE_VARIANTS = new Map([
  ["behavior", "behaviour"],
  ["center", "centre"],
  ["customize", "customise"],
  ["customized", "customised"],
  ["organization", "organisation"],
  ["organize", "organise"],
  ["organized", "organised"],
  ["program", "programme"],
  ["prioritize", "prioritise"],
  ["summarize", "summarise"],
]);

const POLITE_FILLERS = [
  "if that is okay",
  "if its okay",
  "if it is okay",
  "would you mind",
  "could you please",
  "can you please",
  "may i ask",
  "can i ask",
  "i was wondering",
  "i would like to ask",
  "a little bit",
  "a bit more",
  "please",
  "just",
];

const LIGHT_STEM_EXCEPTIONS = new Set([
  "business",
  "process",
  "success",
  "this",
  "is",
  "us",
]);

function replaceMapValues(value, replacements) {
  let next = value;
  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }
  return next;
}

function replaceWholeTerms(value, replacements) {
  let next = value;
  for (const [from, to] of replacements) {
    const pattern = from
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    next = next.replace(new RegExp(`\\b${pattern}\\b`, "g"), to);
  }
  return next;
}

export function stemToken(token) {
  if (token.length < 4 || LIGHT_STEM_EXCEPTIONS.has(token)) return token;
  if (token.endsWith("ies") && token.length > 5) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ing") && token.length > 6) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 5) return token.slice(0, -2);
  if (token.endsWith("es") && token.length > 5) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 4) return token.slice(0, -1);
  return token;
}

export function tokeniseInput(value) {
  return value
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function normaliseInput(rawInput) {
  const raw = String(rawInput || "").normalize("NFKC");
  let expanded = raw
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-");

  expanded = replaceMapValues(expanded, CONTRACTIONS);
  expanded = replaceWholeTerms(expanded, SPELLING_CORRECTIONS);
  expanded = replaceWholeTerms(expanded, LANGUAGE_VARIANTS);

  const punctuated = expanded
    .replace(/\b([a-z0-9]+)'s\b/g, "$1")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let meaningful = ` ${punctuated} `
    .replace(/\b(\w+)(?:\s+\1\b)+/g, "$1")
    .replace(/\s+/g, " ");
  for (const filler of POLITE_FILLERS) {
    meaningful = meaningful.replaceAll(` ${filler} `, " ");
  }
  meaningful = meaningful
    .replace(/\b(\w+)(?:\s+\1\b)+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = tokeniseInput(meaningful);
  return {
    raw,
    expanded: punctuated,
    meaningful,
    tokens,
    stems: tokens.map(stemToken),
    questionWords: tokens.filter((token) =>
      ["what", "why", "how", "who", "which", "where", "when"].includes(token)),
  };
}
