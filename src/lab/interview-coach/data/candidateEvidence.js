export const CANDIDATE_SOURCE_TYPE = "source-backed-cv";

export const candidateEvidence = [
  {
    id: "iris-project-coordination",
    title: "IRIS project coordination",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Coordinates education-sector projects in Asana as a Project Coordinator Associate at IRIS Software UK, ensuring deadlines and milestones are met.",
    supports: ["ownership", "prioritisation", "stakeholder communication"],
    keywords: ["iris", "project", "asana", "coordinator", "education", "deadline", "milestone"],
  },
  {
    id: "isams-training",
    title: "iSAMS school training",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Delivers training sessions to schools, improving adoption and understanding of the iSAMS platform.",
    supports: ["explaining complexity", "customer learning", "product knowledge"],
    keywords: ["isams", "training", "school", "platform", "software", "adoption"],
  },
  {
    id: "client-contact",
    title: "Primary client contact",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Acts as a primary client contact, resolving queries and building strong relationships.",
    supports: ["customer empathy", "communication", "problem solving"],
    keywords: ["client", "query", "customer", "contact", "resolved", "relationship"],
  },
  {
    id: "cross-functional",
    title: "Cross-functional collaboration",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Collaborates across functions to support smooth communication and efficient project execution.",
    supports: ["SME collaboration", "stakeholder management", "raising blockers"],
    keywords: ["cross-functional", "stakeholder", "team", "collaboration", "communication"],
  },
  {
    id: "customer-service",
    title: "Customer-service experience",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Retail roles involved understanding customer needs, providing tailored recommendations and maintaining a positive customer experience.",
    supports: ["customer empathy", "communication", "adaptability"],
    keywords: ["customer service", "customer", "need", "recommendation", "tailored"],
  },
  {
    id: "stem-outreach",
    title: "STEM outreach",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Organised STEM outreach events and school visits, then delivered science sessions to primary and secondary pupils.",
    supports: ["audience adaptation", "facilitation", "engagement"],
    keywords: ["stem", "outreach", "session", "school", "science"],
  },
  {
    id: "teaching-support",
    title: "Teaching and learner support",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Provided one-to-one support, including for SEN pupils, using structured sessions to improve literacy and confidence.",
    supports: ["learner empathy", "feedback", "inclusive support"],
    keywords: ["teaching", "learner", "one-to-one", "support", "sen", "literacy", "confidence"],
  },
  {
    id: "biomedical-degree",
    title: "Biomedical Science degree",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Holds a First Class BSc in Biomedical Science from the University of Warwick; the CV also highlights analytical and organisational skills.",
    supports: ["learning agility", "analysis", "technical curiosity"],
    keywords: ["biomedical", "degree", "first class", "analysis", "analytical", "technical"],
  },
  {
    id: "office-operations",
    title: "Operational and IT support",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Managed administrative processes and schedules while providing IT and operational support across multiple functions.",
    supports: ["organisation", "technical support", "cross-functional delivery"],
    keywords: ["administrative", "schedule", "it support", "operational", "process"],
  },
  {
    id: "healthcare-support",
    title: "Healthcare support",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Supported patient wellbeing and organised group activities to improve engagement and quality of life.",
    supports: ["empathy", "engagement", "responsibility"],
    keywords: ["healthcare", "patient", "wellbeing", "engagement", "activities"],
  },
  {
    id: "recognition",
    title: "Learning and recognition",
    sourceType: CANDIDATE_SOURCE_TYPE,
    summary: "Lists an Asana Foundations Skill Badge and an AIrisian Award among her achievements.",
    supports: ["tool knowledge", "learning agility", "recognition"],
    keywords: ["asana foundations", "skill badge", "airisian", "award"],
  },
];

export function evidenceById(id) {
  return candidateEvidence.find((item) => item.id === id);
}
