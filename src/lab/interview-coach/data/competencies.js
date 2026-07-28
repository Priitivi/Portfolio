export const ROLE_SOURCE_TYPE = "source-backed-interview-pack";
export const PREPARATION_PROMPT_TYPE = "practice-prompt";

export const competencies = [
  {
    id: "learning-design",
    title: "Customer learning design",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Designing useful self-paced learning around a customer outcome rather than listing product features.",
    strongEvidence: "A clear audience need, measurable learning outcome, purposeful structure and a way to check effectiveness.",
    evidenceIds: ["isams-training", "teaching-support"],
  },
  {
    id: "simplification",
    title: "Simplifying complexity",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Turning complex or technical product information into clear, usable explanations.",
    strongEvidence: "An example that identifies the audience, the confusing part, the explanation choice and what improved.",
    evidenceIds: ["isams-training", "biomedical-degree"],
  },
  {
    id: "discovery",
    title: "Discovery with SMEs",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Defining objectives, scope and learning outcomes with Subject Matter Experts and stakeholders.",
    strongEvidence: "Open questions, active listening, respectful challenge, confirmation of assumptions and clear next steps.",
    evidenceIds: ["cross-functional", "client-contact"],
  },
  {
    id: "customer-empathy",
    title: "Customer and learner empathy",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Understanding what customers already know, where they struggle and what they need to do.",
    strongEvidence: "Specific listening or feedback that changed an explanation, training session or delivery decision.",
    evidenceIds: ["client-contact", "customer-service", "teaching-support"],
  },
  {
    id: "delivery",
    title: "Ownership and delivery",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Managing multiple projects while communicating progress, blockers, risks and dependencies.",
    strongEvidence: "A prioritisation decision, visible plan, early escalation and accountable follow-through.",
    evidenceIds: ["iris-project-coordination", "cross-functional"],
  },
  {
    id: "improvement",
    title: "Feedback, data and quality",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Using feedback and data to improve learning while maintaining accessibility and quality.",
    strongEvidence: "What was measured or observed, what changed, and how quality or accessibility was checked.",
    evidenceIds: ["teaching-support", "client-contact"],
  },
  {
    id: "learning-agility",
    title: "Curiosity and learning agility",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Building product knowledge and learning unfamiliar software or subject matter.",
    strongEvidence: "A repeatable learning approach: explore, ask, test, document, explain and validate.",
    evidenceIds: ["biomedical-degree", "isams-training"],
  },
];

export const preparationAreas = [
  {
    id: "end-to-end-example",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Prepare one end-to-end learning example",
    detail: "The supplied CV summary does not state a complete self-paced module case study. Prepare a truthful example that shows discovery, design choices, review and improvement.",
  },
  {
    id: "tools-and-accessibility",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Name the quality approach",
    detail: "Prepare to discuss accessibility checks, quality assurance and any authoring tools you have genuinely used; these details are not named in the supplied CV summary.",
  },
  {
    id: "measures",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Make outcomes concrete",
    detail: "Add truthful measures, feedback or observable results to examples. Avoid inventing numbers where none were recorded.",
  },
  {
    id: "transition",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Explain the move into learning design",
    detail: "Connect current IRIS product and project knowledge, school training, learner support and analytical learning to the role's responsibilities.",
  },
  {
    id: "priorities",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Sharpen the competing-priorities story",
    detail: "Asana use is sourced. Prepare the specific trade-off, risk communication and outcome from a real multi-project situation.",
  },
];

export const smartRebookDiscoveryChecklist = [
  { id: "purpose", title: "Purpose and customer problem", prompt: "What problem is the feature intended to solve, for whom, and why now?" },
  { id: "audience", title: "Target audience", prompt: "Which customer roles need the learning, and are there distinct audience groups?" },
  { id: "prior-knowledge", title: "Current user knowledge", prompt: "What should learners already understand about BookNest, appointments and waitlists?" },
  { id: "outcomes", title: "Desired learning outcomes", prompt: "What should a customer be able to do or decide after the learning?" },
  { id: "workflow", title: "End-to-end workflow", prompt: "What happens before, during and after a cancellation and rebooking?" },
  { id: "activation", title: "Setup and activation", prompt: "How is Smart Rebook enabled, configured and made available?" },
  { id: "waitlist", title: "Waitlist behaviour", prompt: "How is a waitlist created, populated and maintained?" },
  { id: "notifications", title: "Notifications and triggers", prompt: "What triggers communication, who receives it and what do they see?" },
  { id: "edge-cases", title: "Edge cases and likely confusion", prompt: "What happens with competing responses, stale waitlists, errors or incomplete setup?" },
  { id: "support", title: "Support routes", prompt: "Where should customers go when the workflow fails or they need help?" },
  { id: "success", title: "Measures of success", prompt: "How will the product and the learning be judged successful?" },
  { id: "materials", title: "Documentation, demos and test access", prompt: "Which current documents, screenshots, demos and test environments can be used?" },
  { id: "signoff", title: "Review and sign-off stakeholders", prompt: "Who checks product accuracy, learning quality and final approval?" },
  { id: "close", title: "Closing summary and next steps", prompt: "Can I summarise what I heard, confirm gaps, owners, dependencies and the next review?" },
].map((item) => ({ ...item, sourceType: PREPARATION_PROMPT_TYPE }));
