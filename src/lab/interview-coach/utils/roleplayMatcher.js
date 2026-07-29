import { classifyRoleplayTurn } from "../conversation/classifyRoleplayTurn.js";
import { selectRoleplayResponse } from "../conversation/selectRoleplayResponse.js";

export const roleplayTopicLabels = {
  opening: "Opening and agenda",
  "stakeholder-role": "Product Owner role",
  "booknest-context": "BookNest product context",
  "customer-profile": "BookNest customer profile",
  "learning-brief": "Customer-learning brief",
  purpose: "Purpose, customer problem and value",
  audience: "Target audience",
  "prior-knowledge": "Current user knowledge",
  "learning-outcomes": "Desired learning outcomes",
  workflow: "End-to-end workflow",
  setup: "Setup and activation",
  "edge-cases": "Edge cases and likely confusion",
  support: "Support and escalation",
  success: "Success and measurement",
  "content-production": "Source materials and test access",
  "review-stakeholders": "Review, stakeholders and dependencies",
  summary: "Summary and confirmation",
  closing: "Closing and next steps",
};

export function matchRoleplayResponse(input, roleplay = {}) {
  const classification = classifyRoleplayTurn(input, roleplay);
  return selectRoleplayResponse(classification, roleplay);
}
