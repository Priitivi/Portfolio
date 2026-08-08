export const designChallenge = {
  title: "Design a URL shortener",
  intro: "The service starts on one API instance and one relational database. Make three decisions as traffic grows.",
  stages: [
    {
      prompt: "Read traffic jumps to 100k requests per second. What do you add first?",
      options: [
        { id: "cache", label: "Cache", effect: "+ Faster redirects", tradeoff: "Cached mappings now need an expiry and invalidation policy.", recommended: true },
        { id: "queue", label: "Message queue", effect: "+ Absorbs write spikes", tradeoff: "Useful later, but it does little for this read-heavy bottleneck." },
        { id: "index", label: "Database index", effect: "+ Faster lookups", tradeoff: "A good baseline, but the database still receives every redirect." },
      ],
    },
    {
      prompt: "One API instance is saturated. How do you remove the single point of failure?",
      options: [
        { id: "instances", label: "More API instances", effect: "+ Horizontal capacity", tradeoff: "Add a load balancer and keep application nodes stateless.", recommended: true },
        { id: "bigger-db", label: "Bigger database", effect: "+ Database headroom", tradeoff: "The overloaded API and availability risk remain." },
        { id: "cdn", label: "CDN", effect: "+ Edge presence", tradeoff: "Redirect responses are dynamic enough that cache policy needs care." },
      ],
    },
    {
      prompt: "Click analytics must never slow a redirect. Where should that work go?",
      options: [
        { id: "async-events", label: "Event queue", effect: "+ Fast request path", tradeoff: "Analytics becomes eventually consistent and consumers need retry logic.", recommended: true },
        { id: "sync-write", label: "Synchronous write", effect: "+ Immediate counts", tradeoff: "Every redirect inherits analytics latency and failure risk." },
        { id: "browser-only", label: "Browser tracking", effect: "+ Less server work", tradeoff: "Bots, blockers and failed navigation make counts incomplete." },
      ],
    },
  ],
};
