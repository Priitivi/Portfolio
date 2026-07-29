export const CONFIRMED_SOURCE_TYPE = "confirmed-source-fact";
export const FICTIONAL_ASSUMPTION_TYPE = "fictional-exercise-assumption";

export const confirmedSourceFacts = [
  {
    id: "context",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "BookNest is a fictional B2B SaaS product used in the interview exercise.",
  },
  {
    id: "company-profile",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "BookNest has been operating for five years and is used by small, service-based businesses across the UK.",
  },
  {
    id: "core-product",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "Its core product includes an online booking page, a calendar for appointments, automated reminders and simple payment collection.",
  },
  {
    id: "typical-customers",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "Typical BookNest customers include hair and beauty salons, physio and health clinics, personal trainers and dog walkers.",
  },
  {
    id: "feature-status",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "Smart Rebook is presented as a brand-new BookNest feature for customers.",
  },
  {
    id: "meeting",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "The candidate is meeting Duncan, the Smart Rebook Product Owner, for the first time.",
  },
  {
    id: "product-owner",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "Duncan plays the role of the Smart Rebook Product Owner throughout the ten-minute conversation.",
  },
  {
    id: "assessment",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "The exercise assesses discovery. The candidate is gathering enough information to begin a short piece of customer-facing learning, not creating the course.",
  },
  {
    id: "learning-brief",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "The short learning should introduce Smart Rebook, help customers understand how it works and build confidence in setting it up and getting started.",
  },
  {
    id: "core-behaviour",
    sourceType: CONFIRMED_SOURCE_TYPE,
    statement: "When a customer cancels a booking, Smart Rebook automatically emails everyone on the waitlist for that appointment, tells them the slot is available and offers the opportunity to take it.",
  },
];

export const fictionalExerciseAssumptions = [
  {
    id: "role-responsibilities",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For this exercise, Duncan shapes the feature direction, prioritises delivery work and checks that Smart Rebook addresses the intended customer problem.",
  },
  {
    id: "role-involvement",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For this exercise, Duncan owns the product direction for Smart Rebook and connects the delivery team with colleagues who can provide detail for customer learning.",
  },
  {
    id: "role-day-to-day",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "In the practice scenario, Duncan reviews customer needs, clarifies product decisions, prioritises delivery work and checks progress with the people building and supporting the feature.",
  },
  {
    id: "role-authority",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For practice, Duncan owns product-priority and product-accuracy decisions. The Digital Learning lead retains final learning-design approval.",
  },
  {
    id: "role-stakeholders",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "In this exercise, Duncan works with the delivery team, Customer Support and the Digital Learning lead. He can connect the designer with the right product specialist when more detail is needed.",
  },
  {
    id: "meeting-conduct",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For the simulation, Duncan has ten minutes for a focused first conversation and answers product and learning-brief questions without coaching the interview structure.",
  },
  {
    id: "summary-and-close",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For practice, Duncan can confirm points already discussed and asks for a short written summary of confirmed details, open questions, required assets and owners.",
  },
  {
    id: "conversation-boundaries",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For the simulation, Duncan stays in the Product Owner role, does not reveal the complete scenario on request and asks for clarification when a question is genuinely ambiguous.",
  },
  {
    id: "purpose",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For this exercise, the problem is unused appointment capacity after a cancellation. The intended value is to help small-business teams refill that slot without contacting waitlisted people one by one.",
  },
  {
    id: "audience",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For this exercise, the primary learners are BookNest business owners or administrators who manage appointment availability. Front-desk colleagues may also need a short overview of what clients receive.",
  },
  {
    id: "prior-knowledge",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "Assume learners already know how to create appointments, cancel a booking and view a waitlist in BookNest. They may not understand how Smart Rebook connects those actions.",
  },
  {
    id: "learning-outcomes",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For the practice scenario, the key outcome is that an administrator can check the prerequisites, recognise what triggers Smart Rebook and explain the resulting client experience.",
  },
  {
    id: "activation",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "In this exercise, Smart Rebook is enabled by an administrator in appointment settings. It is off by default for existing businesses, and the administrator must confirm an email template before activation.",
  },
  {
    id: "waitlist",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For practice, assume people join a waitlist for a specific appointment type and date window. Business staff can also add someone after obtaining their consent.",
  },
  {
    id: "notification",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "The confirmed trigger is a customer cancelling a booking, which emails everyone on the waitlist for that appointment. For this exercise, the message contains the available time and a secure link to try to claim it.",
  },
  {
    id: "client-experience",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "In the exercise, the client sees the business name, appointment time and a claim button. They are told availability is not guaranteed until the booking is confirmed.",
  },
  {
    id: "multiple-responses",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For this scenario, the first person to complete confirmation gets the slot. Anyone using the link afterwards sees that the appointment is no longer available.",
  },
  {
    id: "after-acceptance",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "In the practice model, the successful client receives the normal booking confirmation and is removed from that waitlist. Other waitlisted clients remain eligible for a future cancellation.",
  },
  {
    id: "errors",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "The most common practice-scenario issues are Smart Rebook not being enabled, an empty waitlist, an unapproved email template and customers assuming the first email guarantees the slot.",
  },
  {
    id: "support",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For the exercise, customers should first use the BookNest help centre. Account-specific failures go to customer support with the appointment reference and time of cancellation.",
  },
  {
    id: "success",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For this scenario, product success is fewer unfilled cancellation slots and less manual contact by business teams. For learning, we would also watch setup-related support contacts and quick confidence feedback.",
  },
  {
    id: "materials",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For practice, I can provide a product demo, draft interface copy, the current help-centre article and screenshots of the administrator and client views.",
  },
  {
    id: "test-access",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For the exercise, a sandbox business can be provided with test clients and waitlists. Email delivery is captured in a test inbox.",
  },
  {
    id: "signoff",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "In this scenario, I own product-accuracy review. Customer Support should review likely confusion, and the Digital Learning lead gives final learning-design approval.",
  },
  {
    id: "timing",
    sourceType: FICTIONAL_ASSUMPTION_TYPE,
    response: "For practice, the target release is four weeks away. Final interface copy and sandbox access are dependencies, and both are expected by the end of this week.",
  },
];

export const exerciseAssumptionById = Object.fromEntries(
  fictionalExerciseAssumptions.map((item) => [item.id, item]),
);

export const confirmedFactById = Object.fromEntries(
  confirmedSourceFacts.map((item) => [item.id, item]),
);
