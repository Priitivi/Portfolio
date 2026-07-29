import {
  confirmedFactById,
  CONFIRMED_SOURCE_TYPE,
  exerciseAssumptionById,
  FICTIONAL_ASSUMPTION_TYPE,
} from "./smartRebookScenario.js";

const confirmed = (id) => `confirmed:${id}`;
const fictional = (id) => `fictional:${id}`;

export const MIXED_SCENARIO_SOURCE_TYPE = "mixed-scenario-sources";

export const roleplayResponseLibrary = {
  identity: {
    topicId: "stakeholder-role",
    sourceRefs: [confirmed("product-owner")],
    levels: [
      [
        "I'm Duncan, the Product Owner for Smart Rebook.",
        "My name is Duncan, and I'm the Product Owner for Smart Rebook.",
      ],
      [
        "I'm Duncan, Smart Rebook's Product Owner. This is our first conversation about the feature.",
        "I'm Duncan. I represent the Smart Rebook Product Owner in this first fact-finding meeting.",
      ],
      [
        "As mentioned, I'm Duncan, the Product Owner for Smart Rebook. If you mean what that role involves, please ask me about the responsibilities rather than my identity.",
      ],
    ],
  },
  "role-responsibilities": {
    topicId: "stakeholder-role",
    sourceRefs: [fictional("role-responsibilities"), fictional("role-stakeholders")],
    levels: [
      [
        "I'm responsible for shaping the feature's direction, prioritising what the delivery team works on and making sure it solves the intended customer problem.",
        "My responsibility is to set the product direction, prioritise delivery work and keep the feature focused on the customer problem it is meant to solve.",
      ],
      [
        "That involves turning customer needs into clear product priorities, making decisions when the team needs direction and checking that the resulting behaviour remains useful and coherent.",
        "I clarify the problem and desired outcome, make product-priority decisions and work with the delivery team to keep Smart Rebook aligned with those decisions.",
      ],
      [
        "I also connect colleagues who need product detail with the appropriate specialists. For customer learning, I can confirm product accuracy and identify where another subject specialist is needed.",
      ],
    ],
  },
  "role-involvement": {
    topicId: "stakeholder-role",
    sourceRefs: [fictional("role-involvement")],
    levels: [
      [
        "I own the product direction for Smart Rebook and help the delivery team understand which customer problem the feature needs to solve.",
        "My involvement is to shape the feature, prioritise the work and keep delivery connected to the intended customer outcome.",
      ],
      [
        "I stay involved through product decisions, delivery questions and accuracy reviews. I can also connect you with colleagues who hold more detailed operational knowledge.",
      ],
      [
        "For your learning work, my role is to confirm that the feature is represented accurately, clarify the intended outcome and identify the right owner for any unanswered detail.",
      ],
    ],
  },
  "role-day-to-day": {
    topicId: "stakeholder-role",
    sourceRefs: [fictional("role-day-to-day")],
    levels: [
      [
        "Day to day, I review customer needs, clarify product decisions and prioritise the work around Smart Rebook.",
        "In practice, I spend time checking priorities, answering delivery questions and making sure the feature remains tied to the customer problem.",
      ],
      [
        "I also check progress with the people building and supporting the feature, resolve product questions and decide when a detail needs input from another specialist.",
      ],
      [
        "The contribution changes with the stage of delivery: early on it is problem and priority definition; later it becomes decision-making, accuracy checking and readiness for release.",
      ],
    ],
  },
  "role-authority": {
    topicId: "stakeholder-role",
    sourceRefs: [fictional("role-authority")],
    levels: [
      [
        "I own product-priority decisions and can confirm whether the learning describes Smart Rebook accurately.",
        "My authority covers the feature's product direction and product accuracy, rather than final learning-design approval.",
      ],
      [
        "I can decide how product needs are prioritised and resolve product questions. The Digital Learning lead still owns final approval of the learning design.",
      ],
      [
        "Where a decision crosses into support practice or learning standards, I would involve the relevant owner rather than making that decision alone.",
      ],
    ],
  },
  "role-stakeholders": {
    topicId: "stakeholder-role",
    sourceRefs: [fictional("role-stakeholders")],
    levels: [
      [
        "I work with the delivery team, Customer Support and the Digital Learning lead around this feature.",
        "The main colleagues in this exercise are the delivery team, Customer Support and the Digital Learning lead.",
      ],
      [
        "The delivery team provides implementation detail, Customer Support helps identify likely confusion, and the Digital Learning lead owns learning-design quality.",
      ],
      [
        "If a question needs deeper product detail, I can identify the right specialist and remain the owner for bringing the answer back into the product view.",
      ],
    ],
  },
  opening: {
    topicId: "opening",
    sourceRefs: [confirmed("assessment"), fictional("meeting-conduct")],
    levels: [
      [
        "That approach works for me. We have ten minutes, and I can answer questions about Smart Rebook and the customer-learning brief.",
        "Yes. Let's use the ten minutes to gather the product and learning information you need for a useful starting brief.",
      ],
      [
        "A focused structure makes sense. I will stay in the Product Owner role and answer the particular discovery questions you ask.",
      ],
      [
        "We have agreed the purpose and timebox. I am ready to continue with the product discovery.",
      ],
    ],
  },
  "meeting-questions": {
    topicId: "opening",
    sourceRefs: [fictional("meeting-conduct")],
    levels: [
      [
        "No questions from me before we begin. I am ready for your discovery questions.",
        "Nothing from me at this stage. Please go ahead with the conversation you have planned.",
      ],
      [
        "I have what I need for this first conversation, so you can continue.",
      ],
      [
        "No additional questions. We can keep the remaining time for your product discovery.",
      ],
    ],
  },
  "booknest-context": {
    topicId: "booknest-context",
    sourceRefs: [confirmed("company-profile"), confirmed("core-product")],
    levels: [
      [
        "BookNest has operated for five years and serves small, service-based businesses across the UK.",
        "BookNest is a five-year-old B2B SaaS product used by small service businesses across the UK.",
      ],
      [
        "Its core product gives those businesses an online booking page, an appointment calendar, automated reminders and simple payment collection.",
      ],
      [
        "The core product supports day-to-day appointment booking and management. Smart Rebook is the new feature being introduced within that product.",
      ],
    ],
  },
  "customer-profile": {
    topicId: "customer-profile",
    sourceRefs: [confirmed("typical-customers")],
    levels: [
      [
        "Typical BookNest customers include hair and beauty salons, physio and health clinics, personal trainers and dog walkers.",
        "The customer examples in the brief are hair and beauty salons, physio and health clinics, personal trainers and dog walkers.",
      ],
      [
        "They are all examples of small service businesses that manage appointment-based work through BookNest.",
      ],
      [
        "Those are the customer types confirmed in the brief. I would not assume additional sectors without checking.",
      ],
    ],
  },
  "learning-brief": {
    topicId: "learning-brief",
    sourceRefs: [confirmed("learning-brief"), confirmed("assessment")],
    levels: [
      [
        "You have been asked to begin a short piece of customer-facing learning that introduces Smart Rebook and explains how it works.",
        "The brief is for short customer-facing learning about Smart Rebook, rather than a complete course built during this meeting.",
      ],
      [
        "It should also build customer confidence in setting the feature up and getting started with it.",
      ],
      [
        "Your task in this conversation is to gather enough information to begin designing that learning; the exercise does not ask you to create it now.",
      ],
    ],
  },
  purpose: {
    topicId: "purpose",
    sourceRefs: [fictional("purpose")],
    levels: [
      [
        "For this exercise, Smart Rebook was created to address unused appointment capacity after a customer cancels.",
        "The customer problem is a cancellation leaving an appointment slot unfilled.",
      ],
      [
        "Without the feature, the practice assumption is that business teams contact waitlisted people one by one to try to refill the slot.",
        "The difficulty is the manual effort involved in contacting waitlisted clients individually while the slot remains unused.",
      ],
      [
        "The intended customer value is less manual contact and a better chance of refilling the cancellation slot. The business value is recovering capacity that might otherwise be lost.",
      ],
    ],
  },
  audience: {
    topicId: "audience",
    sourceRefs: [fictional("audience")],
    levels: [
      [
        "For this exercise, the primary learners are BookNest business owners or administrators who manage appointment availability.",
        "The main audience is the BookNest owner or administrator responsible for appointment availability.",
      ],
      [
        "Front-desk colleagues may also need a short overview so they understand what clients receive and can respond consistently.",
      ],
      [
        "The learning should not assume that every BookNest user configures the feature. It should distinguish administrators who set it up from colleagues who only need awareness of the client experience.",
      ],
    ],
  },
  "prior-knowledge": {
    topicId: "prior-knowledge",
    sourceRefs: [fictional("prior-knowledge")],
    levels: [
      [
        "Assume learners already know how to create appointments, cancel a booking and view a waitlist in BookNest.",
        "Their starting point is familiarity with BookNest appointments, cancellations and viewing a waitlist.",
      ],
      [
        "They may not understand how Smart Rebook connects those existing actions into an automatic workflow.",
      ],
      [
        "The learning therefore needs to bridge familiar appointment tasks with the new trigger, client communication and setup decisions, rather than reteaching the whole product.",
      ],
    ],
  },
  "learning-outcomes": {
    topicId: "learning-outcomes",
    sourceRefs: [confirmed("learning-brief"), fictional("learning-outcomes")],
    levels: [
      [
        "The key outcome is confidence in setting Smart Rebook up, recognising what triggers it and getting started.",
        "After the learning, an administrator should understand the trigger and feel able to begin using the feature.",
      ],
      [
        "For the practice scenario, they should also be able to check the prerequisites and explain the resulting client experience.",
      ],
      [
        "A useful learner outcome is not simply recalling the feature description; it is being able to decide whether setup is ready and explain what happens when a cancellation occurs.",
      ],
    ],
  },
  "core-behaviour": {
    topicId: "workflow",
    sourceRefs: [confirmed("core-behaviour")],
    levels: [
      [
        "When a customer cancels a booking, Smart Rebook automatically emails everyone on the waitlist for that appointment and offers them the available slot.",
        "The confirmed workflow begins with a booking cancellation, which triggers an email to everyone waiting for that appointment.",
      ],
      [
        "The email tells those waitlisted clients that the slot is available and gives them the opportunity to take it.",
      ],
      [
        "That cancellation-to-email behaviour is the complete workflow confirmed in the source brief. Setup, claiming and edge-case details in this simulation are fictional practice assumptions.",
      ],
    ],
  },
  activation: {
    topicId: "setup",
    sourceRefs: [fictional("activation")],
    levels: [
      [
        "In this exercise, an administrator enables Smart Rebook in appointment settings.",
        "The practice assumption is that a BookNest administrator turns the feature on from appointment settings.",
      ],
      [
        "It is off by default for existing businesses, and the administrator must confirm an email template before activation.",
      ],
      [
        "The administrator is the person who performs those setup steps. If the feature is still off or the template is not confirmed, the workflow is not ready to run.",
      ],
    ],
  },
  waitlist: {
    topicId: "workflow",
    sourceRefs: [fictional("waitlist")],
    levels: [
      [
        "For practice, assume clients join a waitlist for a specific appointment type and date window.",
        "The exercise assumes the waitlist is linked to an appointment type and a date window.",
      ],
      [
        "Business staff can also add someone after obtaining their consent.",
      ],
      [
        "That means the learning should make the waitlist prerequisite visible without inventing a separate enrolment process beyond those two practice assumptions.",
      ],
    ],
  },
  notification: {
    topicId: "workflow",
    sourceRefs: [confirmed("core-behaviour"), fictional("notification")],
    levels: [
      [
        "The confirmed trigger is a customer cancelling a booking. Everyone on the waitlist for that appointment is emailed.",
        "A booking cancellation triggers the email to the full waitlist for that appointment.",
      ],
      [
        "For this exercise, the message includes the available appointment time and a secure link to try to claim it.",
      ],
      [
        "The email offers a chance to take the slot; it does not itself guarantee that the booking has been secured.",
      ],
    ],
  },
  "client-experience": {
    topicId: "workflow",
    sourceRefs: [fictional("client-experience")],
    levels: [
      [
        "In the exercise, the client sees the business name, appointment time and a button to try to claim the slot.",
        "The practice email shows the business, the available appointment time and a claim action.",
      ],
      [
        "It also makes clear that availability is not guaranteed until the booking is confirmed.",
      ],
      [
        "The client follows the secure claim link and completes confirmation. The message needs to distinguish an invitation to try from a confirmed booking.",
      ],
    ],
  },
  "multiple-responses": {
    topicId: "edge-cases",
    sourceRefs: [fictional("multiple-responses")],
    levels: [
      [
        "For this scenario, the first person to complete confirmation gets the slot.",
        "The practice rule is first completed confirmation, rather than first email open or first click.",
      ],
      [
        "Anyone using the link after the slot has been confirmed sees that the appointment is no longer available.",
      ],
      [
        "That is why the client message should avoid implying that receiving or opening the email reserves the slot.",
      ],
    ],
  },
  "after-acceptance": {
    topicId: "workflow",
    sourceRefs: [fictional("after-acceptance")],
    levels: [
      [
        "In the practice model, the successful client receives the normal booking confirmation.",
        "After a successful claim, the client gets the usual booking confirmation.",
      ],
      [
        "They are removed from that waitlist, while the other waitlisted clients remain eligible for a future cancellation.",
      ],
      [
        "So the next relevant state is a confirmed booking for the successful client, not a further Smart Rebook promise to everyone who received the email.",
      ],
    ],
  },
  errors: {
    topicId: "edge-cases",
    sourceRefs: [fictional("errors")],
    levels: [
      [
        "The main practice-scenario issues are the feature not being enabled, an empty waitlist or an unapproved email template.",
        "Common setup problems in this exercise are Smart Rebook being off, no eligible waitlist or an email template that has not been approved.",
      ],
      [
        "A likely customer misunderstanding is assuming that receiving the first email guarantees the appointment.",
      ],
      [
        "Those issues can make the workflow appear not to work or create false expectations. They are the limitations modelled for this exercise; I would not add others without evidence.",
      ],
    ],
  },
  support: {
    topicId: "support",
    sourceRefs: [fictional("support")],
    levels: [
      [
        "For the exercise, customers should start with the BookNest help centre.",
        "The practice support route begins with the BookNest help centre.",
      ],
      [
        "Account-specific failures should go to Customer Support with the appointment reference and cancellation time.",
      ],
      [
        "That distinction lets general setup questions use self-service guidance while account-specific investigation reaches Support with enough context.",
      ],
    ],
  },
  success: {
    topicId: "success",
    sourceRefs: [fictional("success")],
    levels: [
      [
        "For this scenario, product success means fewer unfilled cancellation slots and less manual contact by business teams.",
        "The main product signals are more cancellation slots being refilled and less one-by-one contact by staff.",
      ],
      [
        "For the learning, we would also watch setup-related support contacts and quick confidence feedback.",
      ],
      [
        "After launch, I would look for those signals together: adoption alone would not show whether customers configured the feature correctly or achieved the intended outcome.",
      ],
    ],
  },
  materials: {
    topicId: "content-production",
    sourceRefs: [fictional("materials")],
    levels: [
      [
        "For practice, I can provide a product demo, draft interface copy and the current help-centre article.",
        "The available practice materials are a demo, draft interface copy and the existing help-centre article.",
      ],
      [
        "I can also provide screenshots of the administrator and client views.",
      ],
      [
        "Those assets should be checked against the final interface before release because the current copy is still draft material.",
      ],
    ],
  },
  "test-access": {
    topicId: "content-production",
    sourceRefs: [fictional("test-access")],
    levels: [
      [
        "For the exercise, I can provide a sandbox business with test clients and waitlists.",
        "A practice sandbox is available with test clients and waitlist data.",
      ],
      [
        "Email delivery is captured in a test inbox, so the workflow can be explored without contacting real clients.",
      ],
      [
        "That gives you a safe way to capture the administrator and client views and verify the sequence before producing learning.",
      ],
    ],
  },
  signoff: {
    topicId: "review-stakeholders",
    sourceRefs: [fictional("signoff")],
    levels: [
      [
        "In this scenario, I own the product-accuracy review.",
        "I am the reviewer for product accuracy in this practice scenario.",
      ],
      [
        "Customer Support should review likely confusion, and the Digital Learning lead gives final learning-design approval.",
      ],
      [
        "So the review has three distinct purposes: product accuracy from me, support insight from Customer Support and learning-design approval from the Digital Learning lead.",
      ],
    ],
  },
  timing: {
    topicId: "review-stakeholders",
    sourceRefs: [fictional("timing")],
    levels: [
      [
        "For practice, the target release is four weeks away.",
        "The exercise assumes a release target four weeks from now.",
      ],
      [
        "Final interface copy and sandbox access are dependencies, and both are expected by the end of this week.",
      ],
      [
        "Those dependencies affect when screenshots and final wording can be confirmed, so they should be tracked before content sign-off.",
      ],
    ],
  },
  summary: {
    topicId: "summary",
    sourceRefs: [fictional("summary-and-close")],
    levels: [
      [
        "Please go ahead. I can confirm the points you have repeated from our conversation and identify anything that remains an open question.",
        "Yes, summarise what you have understood. I will confirm only the details we have actually discussed.",
      ],
      [
        "Your summary should separate confirmed information from the open points that still need an owner or source.",
      ],
      [
        "That gives us a usable record of what can move into design and what still needs validation.",
      ],
    ],
  },
  "next-steps": {
    topicId: "closing",
    sourceRefs: [fictional("summary-and-close")],
    levels: [
      [
        "Please send a short summary of your understanding, the open questions and the assets you need.",
        "The next step is a concise written summary covering confirmed detail, remaining gaps and required materials.",
      ],
      [
        "I will confirm product accuracy and identify the owners for any gaps.",
      ],
      [
        "Once the final interface copy and sandbox are available, we can use that summary to confirm readiness for learning production and review.",
      ],
    ],
  },
  thanks: {
    topicId: "closing",
    sourceRefs: [fictional("summary-and-close")],
    levels: [
      [
        "You're welcome. Please send the summary and open questions we agreed.",
        "Thank you. I will look out for your summary of the confirmed detail, gaps and assets.",
      ],
      [
        "Thanks for the conversation. I will confirm product accuracy and the owners for any remaining questions.",
      ],
      [
        "That closes the first fact-finding conversation. The written summary is the agreed follow-up.",
      ],
    ],
  },
};

export const boundaryResponses = {
  empty: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "I did not catch a question there. Could you rephrase the particular detail you need?",
    ],
  },
  broad: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "There are several parts to that. Would you like to focus first on why Smart Rebook exists or on how one part of the workflow operates?",
      "It would be better to focus on the particular information you need. Which area would you like to explore?",
    ],
  },
  coaching: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "For this conversation, I'll stay in the Product Owner role. I can answer questions about the product, but I won't guide the structure of your interview.",
    ],
  },
  revealAll: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "It would be better to focus on the particular information you need. Which area would you like to explore?",
      "I won't reveal the whole scenario at once. Ask about the specific product or learning detail you need.",
    ],
  },
  offTopic: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "That is outside my role in this exercise. I can answer questions about Smart Rebook, its customer purpose and the product information needed for the learning.",
    ],
  },
  ambiguousReference: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "I am not sure what “that” refers to yet. Could you name the part of Smart Rebook you want me to explain?",
      "Could you clarify the topic you mean? I do not want to guess and give you an unrelated detail.",
    ],
  },
  lowConfidence: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "Could you narrow that down slightly—are you asking about setup, what happens after a cancellation, or what the client receives?",
      "Could you rephrase that as one specific product or learning question? I do not want to assume which detail you need.",
    ],
  },
  ambiguousCandidates: {
    sourceRefs: [fictional("conversation-boundaries")],
    variants: [
      "I can see two possible topics in that question. Which one would you like me to answer first?",
    ],
  },
};

function parseSourceRef(reference) {
  const separator = reference.indexOf(":");
  return {
    category: reference.slice(0, separator),
    id: reference.slice(separator + 1),
  };
}

export function sourceTypesForReferences(sourceRefs) {
  const types = new Set(sourceRefs.map((reference) => {
    const { category } = parseSourceRef(reference);
    return category === "confirmed" ? CONFIRMED_SOURCE_TYPE : FICTIONAL_ASSUMPTION_TYPE;
  }));
  return [...types];
}

export function validateRoleplayResponseLibrary() {
  const errors = [];
  const groups = [
    ...Object.entries(roleplayResponseLibrary).map(([id, entry]) => ({
      id,
      sourceRefs: entry.sourceRefs,
      texts: entry.levels.flat(),
    })),
    ...Object.entries(boundaryResponses).map(([id, entry]) => ({
      id: `boundary:${id}`,
      sourceRefs: entry.sourceRefs,
      texts: entry.variants,
    })),
  ];

  for (const group of groups) {
    if (!group.sourceRefs?.length) errors.push(`${group.id} has no source references.`);
    if (!group.texts?.length || group.texts.some((text) => !text.trim())) {
      errors.push(`${group.id} has an empty authored response.`);
    }
    for (const reference of group.sourceRefs || []) {
      const { category, id } = parseSourceRef(reference);
      if (category === "confirmed" && !confirmedFactById[id]) {
        errors.push(`${group.id} references missing confirmed fact "${id}".`);
      } else if (category === "fictional" && !exerciseAssumptionById[id]) {
        errors.push(`${group.id} references missing fictional assumption "${id}".`);
      } else if (!["confirmed", "fictional"].includes(category)) {
        errors.push(`${group.id} uses invalid source category "${category}".`);
      }
    }
  }

  return errors;
}

const responseValidationErrors = validateRoleplayResponseLibrary();
if (responseValidationErrors.length) {
  throw new Error(`Invalid Smart Rebook response library:\n${responseValidationErrors.join("\n")}`);
}
