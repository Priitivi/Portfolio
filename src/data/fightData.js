export const creatorOptions = {
  hair: [
    { value: "spikes", label: "Storm spikes" },
    { value: "twists", label: "Crown twists" },
    { value: "fade", label: "Shadow fade" },
  ],
  skin: [
    { value: "#8d5524", label: "Warm brown" },
    { value: "#5c321e", label: "Deep brown" },
    { value: "#b97850", label: "Copper brown" },
    { value: "#d6a176", label: "Golden tan" },
  ],
  top: [
    { value: "#17191f", label: "Midnight" },
    { value: "#facc15", label: "Volt yellow" },
    { value: "#f4f4f5", label: "Chalk white" },
    { value: "#6b3f2a", label: "Earth brown" },
  ],
  bottom: [
    { value: "#20232a", label: "Graphite" },
    { value: "#4d2d1f", label: "Dark brown" },
    { value: "#d4d4d8", label: "Silver" },
  ],
  shoes: [
    { value: "#facc15", label: "Volt" },
    { value: "#f4f4f5", label: "White" },
    { value: "#111318", label: "Black" },
  ],
  weapon: [
    { value: "fists", label: "Arc fists", detail: "Fast / 12 damage" },
    { value: "sword", label: "Codeblade", detail: "Balanced / 18 damage" },
    { value: "bow", label: "Signal bow", detail: "Ranged / 10 damage" },
  ],
};

export const defaultFighter = {
  hair: "spikes",
  skin: "#8d5524",
  top: "#17191f",
  bottom: "#20232a",
  shoes: "#facc15",
  weapon: "sword",
};

export const weaponStats = {
  fists: { damage: 12, range: 2, cooldown: 0.38 },
  sword: { damage: 18, range: 2.75, cooldown: 0.62 },
  bow: { damage: 10, range: 9, cooldown: 0.78 },
};

export const storyPanels = [
  {
    number: "01",
    title: "The portfolio was sealed.",
    copy: "Not behind a password. Behind a fighter who turned every project, failure, and late-night commit into armour.",
  },
  {
    number: "02",
    title: "They call him The Architect.",
    copy: "Priitivi waits in the Compile Arena. Three shields protect three chapters of his story.",
  },
  {
    number: "03",
    title: "Break the build. Read the truth.",
    copy: "Win each round to unlock the person, the work, and what comes next. Your name is already on the challenge.",
  },
];

export const portfolioReveals = [
  {
    label: "Shield one broken",
    title: "About Priitivi",
    copy: "Priitivi is a Computer Science graduate from the University of Warwick, based in London. He enjoys building thoughtful web experiences that combine clean interfaces, practical engineering, and creative problem solving.",
    facts: ["BSc Computer Science", "University of Warwick", "London, UK", "Full-stack development"],
  },
  {
    label: "Shield two broken",
    title: "Selected projects",
    copy: "The work ranges from full-stack community tools to desktop software designed around a real personal problem.",
    projects: [
      { name: "CS2Squad", detail: "Steam-authenticated teammate finding with React, Node.js, PostgreSQL, and Docker.", href: "https://github.com/priitivi/cs2squad" },
      { name: "CSShield", detail: "An Electron utility that blocks gambling domains at system level.", href: "https://github.com/priitivi/csshield" },
      { name: "Portfolio", detail: "A creative React portfolio—now experimenting with playable storytelling.", href: "https://github.com/priitivi/Portfolio" },
    ],
  },
  {
    label: "Final shield broken",
    title: "Work, direction & contact",
    copy: "Priitivi is building creative web applications and products while looking for opportunities to grow as a software developer. If the way he thinks and builds fits your team, start a conversation.",
    facts: ["React & JavaScript", "Node.js & PostgreSQL", "Python & Java", "Docker & product-minded UI"],
    links: [
      { label: "Email Priitivi", href: "mailto:priitivi@gmail.com" },
      { label: "GitHub profile", href: "https://github.com/priitivi" },
      { label: "Download CV", href: "/Priit_CV.pdf" },
    ],
  },
];
