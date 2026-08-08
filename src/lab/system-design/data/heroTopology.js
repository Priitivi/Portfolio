export const heroConnections = [
  { id: "hero-client-api", from: "hero-client", to: "hero-api", fromAnchor: "bottom", toAnchor: "top" },
  { id: "hero-api-redis", from: "hero-api", to: "hero-redis", fromAnchor: "bottom", toAnchor: "top" },
  { id: "hero-redis-database", from: "hero-redis", to: "hero-database", fromAnchor: "bottom", toAnchor: "top" },
];

export const heroRequestSequence = [
  { connectionId: "hero-client-api", from: "hero-client", to: "hero-api" },
  { connectionId: "hero-api-redis", from: "hero-api", to: "hero-redis" },
  { connectionId: "hero-redis-database", from: "hero-redis", to: "hero-database" },
  { connectionId: "hero-redis-database", from: "hero-database", to: "hero-redis", reverse: true },
  { connectionId: "hero-api-redis", from: "hero-redis", to: "hero-api", reverse: true },
  { connectionId: "hero-client-api", from: "hero-api", to: "hero-client", reverse: true },
];
