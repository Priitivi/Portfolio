export const ROLE_SOURCE_TYPE = "source-backed-interview-pack";
export const PREPARATION_PROMPT_TYPE = "practice-prompt";

export const competencies = [
  {
    id: "learning-design",
    title: "Learning design and production",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Designing engaging self-paced learning with clear objectives, instructional copy, appropriate media, meaningful knowledge checks and structured LMS pathways.",
    strongEvidence: "A clear learner need and outcome, purposeful content choices, a suitable check of understanding, and evidence that the finished learning was tested.",
    evidenceIds: ["isams-training", "stem-outreach", "teaching-support"],
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
    title: "SME discovery and scope",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Defining objectives, scope and learning outcomes with Subject Matter Experts and stakeholders.",
    strongEvidence: "Open questions, active listening, respectful challenge, clear expectations, confirmation of assumptions and agreed next steps.",
    evidenceIds: ["cross-functional", "client-contact"],
  },
  {
    id: "customer-empathy",
    title: "Product knowledge and empathy",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Learning product features and workflows while understanding users' roles, pressures, goals, prior knowledge and common challenges.",
    strongEvidence: "A specific customer or learner insight that changed the structure, tone or content of an explanation or training decision.",
    evidenceIds: ["client-contact", "customer-service", "teaching-support"],
  },
  {
    id: "stakeholder-engagement",
    title: "Stakeholder engagement",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Building proactive relationships, engaging confidently and approachably, finding the right specialists, setting expectations and collaborating on how learning is launched.",
    strongEvidence: "A clear example of identifying the right people, agreeing scope and responsibilities, communicating value, solving problems collaboratively and following through reliably.",
    evidenceIds: ["client-contact", "cross-functional"],
  },
  {
    id: "delivery",
    title: "Ownership and delivery",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Managing concurrent projects autonomously, meeting deadlines and production targets, and communicating progress, changes, risks and dependencies.",
    strongEvidence: "A prioritisation decision, visible plan, early escalation, clear trade-off and accountable follow-through without compromising quality.",
    evidenceIds: ["iris-project-coordination", "office-operations"],
  },
  {
    id: "improvement",
    title: "Quality and continuous improvement",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Peer reviewing, following standards, maintaining accessibility and using feedback, assessment results, engagement and usage data to improve learning.",
    strongEvidence: "What was checked or measured, the insight found, the change made, and how accuracy, accessibility and consistency were protected.",
    evidenceIds: ["teaching-support", "client-contact"],
  },
  {
    id: "learning-agility",
    title: "Learning agility and adaptability",
    sourceType: ROLE_SOURCE_TYPE,
    assessmentFocus: "Learning unfamiliar products, authoring tools and processes with curiosity and thoroughness while adapting patiently and resiliently to change.",
    strongEvidence: "A repeatable approach: explore, ask, test, document, explain and validate, with enough attention to detail to update learning safely when the product changes.",
    evidenceIds: ["biomedical-degree", "isams-training", "recognition"],
  },
];

export const preparationAreas = [
  {
    id: "end-to-end-example",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Prepare an end-to-end digital learning example",
    detail: "The CV shows client-facing training but does not state a complete self-paced e-learning project. Prepare a truthful example that shows discovery, design choices, production, review and improvement.",
  },
  {
    id: "production-tools",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Name the production toolkit",
    detail: "The CV does not name e-learning authoring tools, LMS work, screenshots, screencasts, video editing or AI-assisted content workflows. Prepare only the tools and examples you have genuinely used.",
  },
  {
    id: "quality-and-accessibility",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Make quality checks concrete",
    detail: "Prepare to explain how you would check accuracy, accessibility, consistency, instructional copy and knowledge checks, including how you would use peer review.",
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
    title: "Clarify the career story",
    detail: "The CV profile currently emphasises scientific or healthcare-focused roles. Prepare a concise, truthful explanation of why digital learning is the intended next step, using current IRIS knowledge, school training and learner support.",
  },
  {
    id: "priorities",
    sourceType: PREPARATION_PROMPT_TYPE,
    title: "Sharpen the competing-priorities story",
    detail: "Asana use is sourced. Prepare the specific trade-off, risk communication and outcome from a real multi-project situation.",
  },
];

export const candidatePreparationNotes = [
  {
    id: "opening-plan",
    sourceType: "candidate-preparation-note",
    title: "Open with purpose",
    detail: "Introduce yourself, ask about the Product Owner's role, outline that you need to understand the feature, audience, customer problem and desired outcome, then check whether they have questions before you begin.",
  },
  {
    id: "motivation",
    sourceType: "candidate-preparation-note",
    title: "Use the motivation thread",
    detail: "Your notes connect product knowledge and customer experience with a genuine enjoyment of breaking complex processes into smaller, easy-to-understand chunks.",
  },
  {
    id: "wider-impact",
    sourceType: "candidate-preparation-note",
    title: "Explain the wider impact",
    detail: "Your notes contrast helping with individual queries today with creating learning that can build confidence for a wider customer audience.",
  },
  {
    id: "close-plan",
    sourceType: "candidate-preparation-note",
    title: "Close with a usable summary",
    detail: "Summarise the value, setup and common mistakes you have heard, then confirm open questions, review needs and next actions.",
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
