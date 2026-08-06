import { assessmentCategories } from "../data/catalog.js";

export function formatRelativeDate(value, now = Date.now()) {
  const date = new Date(value);
  const delta = Math.max(0, Math.round((now - date.getTime()) / 86_400_000));
  if (delta === 0) return "Today";
  if (delta === 1) return "Yesterday";
  return `${delta} days ago`;
}

export function formatSessionCondition(session) {
  const context = session.type === "simulation" ? session.formatId : session.difficulty;
  if (!session.timingProfile) return context;
  const pace = session.timingProfile === "extended" ? "+50% time" : session.timingProfile === "untimed" ? "untimed" : "standard pace";
  return `${context} · ${pace}`;
}

export function sessionPresentation(session) {
  const category = assessmentCategories.find((item) => item.id === session.category);
  return {
    icon: category?.icon || "Σ",
    title: session.type === "simulation" ? "Mixed simulation" : category?.label || session.category,
    measure: session.type === "interview" ? "heuristic" : "accuracy",
  };
}
