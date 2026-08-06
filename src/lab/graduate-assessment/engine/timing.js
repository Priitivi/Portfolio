export const timingProfiles = [
  { id: "standard", label: "Assessment pace", description: "Use the standard time limit for this difficulty.", multiplier: 1 },
  { id: "extended", label: "Extended pace", description: "Add 50% more time as a practice accommodation.", multiplier: 1.5 },
  { id: "untimed", label: "Untimed learning", description: "Remove the countdown and focus on method before speed.", multiplier: null },
];

export function timingProfile(id) {
  return timingProfiles.find((profile) => profile.id === id) || timingProfiles[0];
}

export function adjustedSeconds(seconds, profileId = "standard") {
  const profile = timingProfile(profileId);
  if (profile.multiplier === null) return null;
  const base = Math.max(1, Math.round(Number(seconds) || 1));
  return Math.max(1, Math.round(base * profile.multiplier));
}

export function timingDescription(profileId, standardSeconds) {
  const seconds = adjustedSeconds(standardSeconds, profileId);
  return seconds === null ? "No automatic timeout" : `${seconds}s per question`;
}
