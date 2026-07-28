import { ROLE_SOURCE_TYPE } from "./competencies.js";

export const mockQuestions = [
  {
    id: "motivation",
    competency: "motivation",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "What attracts you to the Digital Learning Designer role, and why is this the right next step for you?",
    followUps: [
      { id: "motivation-impact", prompt: "Which part of your current experience gives you the strongest foundation for that move?" },
    ],
  },
  {
    id: "simplify",
    competency: "simplifying complexity",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Tell me about a time you explained a complex process or product clearly to someone unfamiliar with it.",
    followUps: [
      { id: "simplify-evidence", prompt: "How did you know your explanation had worked?" },
      { id: "simplify-adapt", prompt: "What did you change when the learner did not understand immediately?" },
    ],
  },
  {
    id: "self-paced-production",
    competency: "learning design and production",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How would you turn a complex software workflow into a short, engaging piece of self-paced online learning?",
    followUps: [
      { id: "self-paced-check", prompt: "Which content formats and knowledge check would you choose, and why?" },
    ],
  },
  {
    id: "sme",
    competency: "SME collaboration",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How would you work with a busy Subject Matter Expert to turn their product knowledge into focused customer learning?",
    followUps: [
      { id: "sme-challenge", prompt: "What would you do if the expert wanted every product detail included?" },
    ],
  },
  {
    id: "quality",
    competency: "quality and accessibility",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How would you test and peer review learning before loading it into an LMS or releasing it to customers?",
    followUps: [
      { id: "quality-accessibility", prompt: "What accessibility and consistency checks would you include?" },
    ],
  },
  {
    id: "ai-workflow",
    competency: "AI-assisted workflows",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How would you use AI-assisted workflows to produce learning efficiently without weakening accuracy, accessibility or your own judgement?",
  },
  {
    id: "stakeholders",
    competency: "stakeholder communication",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Describe a time you kept clients or stakeholders informed while coordinating a piece of work.",
  },
  {
    id: "empathy",
    competency: "customer empathy",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Give an example of customer or learner feedback changing how you approached support, training or delivery.",
    followUps: [
      { id: "empathy-balance", prompt: "How did you balance that individual need with the wider delivery goal?" },
    ],
  },
  {
    id: "priorities",
    competency: "competing priorities",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Tell me about a time you managed competing projects or deadlines. How did you decide what to do first?",
    followUps: [
      { id: "priorities-risk", prompt: "Which risk or trade-off did you communicate, and how did you protect quality while meeting the target?" },
    ],
  },
  {
    id: "feedback",
    competency: "receiving feedback",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Tell me about feedback you received that caused you to improve your work.",
  },
  {
    id: "blockers",
    competency: "raising blockers",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Describe a blocker or delivery risk you raised early. What action did you take after escalating it?",
  },
  {
    id: "new-software",
    competency: "learning agility",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How do you build enough knowledge of unfamiliar software to explain it accurately to customers?",
    followUps: [
      { id: "new-software-validation", prompt: "How would you validate your understanding before publishing learning?" },
    ],
  },
  {
    id: "product-change",
    competency: "content maintenance",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "A product release changes a workflow covered by existing learning. How would you assess, update and communicate the change?",
  },
  {
    id: "useful-learning",
    competency: "instructional design",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How would you make sure learning is useful and task-focused rather than a tour of product features?",
  },
  {
    id: "measurement",
    competency: "learning effectiveness",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "How would you decide whether a piece of customer learning is effective?",
    followUps: [
      { id: "measurement-data", prompt: "What would you change if completion and engagement were high but assessment results, usage data or support contacts still showed confusion?" },
    ],
  },
  {
    id: "ownership",
    competency: "ownership and accountability",
    sourceType: ROLE_SOURCE_TYPE,
    prompt: "Tell me about a piece of work you took ownership of from uncertainty through to a clear outcome.",
  },
];
