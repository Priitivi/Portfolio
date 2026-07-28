export const CANDIDATE_SOURCE_TYPE = "source-backed-cv";

export const candidateEvidence = [
  {
    id: "iris-project-coordination",
    title: "IRIS project coordination",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Project Coordinator Associate at IRIS Software UK, coordinating education-sector projects in Asana.",
    supports: ["ownership", "prioritisation", "stakeholder communication"],
    keywords: ["iris", "project", "asana", "coordinator", "education"],
  },
  {
    id: "isams-training",
    title: "iSAMS school training",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Delivered training to schools on the iSAMS platform.",
    supports: ["explaining complexity", "customer learning", "product knowledge"],
    keywords: ["isams", "training", "school", "platform", "software"],
  },
  {
    id: "client-contact",
    title: "Primary client contact",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Acted as a primary client contact and resolved client queries.",
    supports: ["customer empathy", "communication", "problem solving"],
    keywords: ["client", "query", "customer", "contact", "resolved"],
  },
  {
    id: "cross-functional",
    title: "Cross-functional collaboration",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Worked across functions while coordinating delivery.",
    supports: ["SME collaboration", "stakeholder management", "raising blockers"],
    keywords: ["cross-functional", "stakeholder", "team", "collaboration"],
  },
  {
    id: "customer-service",
    title: "Customer-service experience",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Previous customer-service work provides evidence of listening, empathy and query resolution.",
    supports: ["customer empathy", "communication", "adaptability"],
    keywords: ["customer service", "customer", "listening", "empathy"],
  },
  {
    id: "stem-outreach",
    title: "STEM outreach",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Delivered STEM outreach and school sessions.",
    supports: ["audience adaptation", "facilitation", "engagement"],
    keywords: ["stem", "outreach", "session", "school"],
  },
  {
    id: "teaching-support",
    title: "Teaching and learner support",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Teaching and one-to-one learner support demonstrate adapting explanations to individual needs.",
    supports: ["learner empathy", "feedback", "inclusive support"],
    keywords: ["teaching", "learner", "one-to-one", "support"],
  },
  {
    id: "biomedical-degree",
    title: "Biomedical Science degree",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "A First Class Biomedical Science degree supports analytical learning and the ability to understand technical material.",
    supports: ["learning agility", "analysis", "technical curiosity"],
    keywords: ["biomedical", "degree", "first class", "analysis", "technical"],
  },
];

export function evidenceById(id) {
  return candidateEvidence.find((item) => item.id === id);
}
