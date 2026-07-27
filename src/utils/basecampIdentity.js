const FALLBACK_NAME = "Crewmate";

const legacyCrewByEmail = new Map([
  ["priitivi@gmail.com", { id: "priitivi", name: "Priitivi" }],
  ["husainabedi@gmail.com", { id: "husain", name: "Husain" }],
  ["dhaneshlian@gmail.com", { id: "dhanesh", name: "Dhanesh" }],
]);

const legacyCrewById = new Map(
  [...legacyCrewByEmail.values()].map((profile) => [profile.id, profile]),
);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanName(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, 40)
    : "";
}

function cleanProfileId(value) {
  if (typeof value !== "string") return "";
  const id = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) ? id : "";
}

function getAppMetadata(user) {
  return asRecord(user?.appMetadata ?? user?.app_metadata);
}

function getUserMetadata(user) {
  return asRecord(user?.userMetadata ?? user?.user_metadata);
}

export function getBasecampDisplayName(user) {
  const appMetadata = getAppMetadata(user);
  const managedName = cleanName(
    appMetadata.basecampName ?? appMetadata.basecamp_name,
  );
  if (managedName) return managedName;

  const normalizedEmail = typeof user?.email === "string"
    ? user.email.trim().toLowerCase()
    : "";
  const legacyProfile = legacyCrewByEmail.get(normalizedEmail);
  if (legacyProfile) return legacyProfile.name;

  const userMetadata = getUserMetadata(user);
  return cleanName(user?.name)
    || cleanName(userMetadata.full_name)
    || cleanName(userMetadata.name)
    || FALLBACK_NAME;
}

export function hasBasecampDisplayName(user) {
  return getBasecampDisplayName(user) !== FALLBACK_NAME;
}

export function getBasecampProfile(user) {
  const appMetadata = getAppMetadata(user);
  const managedId = cleanProfileId(
    appMetadata.basecampId ?? appMetadata.basecamp_id,
  );
  const normalizedEmail = typeof user?.email === "string"
    ? user.email.trim().toLowerCase()
    : "";
  const legacyProfile = legacyCrewByEmail.get(normalizedEmail);
  const subject = typeof user?.id === "string" && user.id.trim()
    ? user.id.trim()
    : "crew";

  return {
    id: managedId || legacyProfile?.id || `identity-${subject}`,
    name: getBasecampDisplayName(user),
    hasDisplayName: hasBasecampDisplayName(user),
    source: managedId
      ? "managed"
      : legacyProfile
        ? "legacy"
        : "identity",
  };
}

export function getKnownBasecampNameById(id) {
  return legacyCrewById.get(id)?.name || "";
}

export function normalizeManagedBasecampProfile(value) {
  const profile = asRecord(value);
  const id = cleanProfileId(profile.id);
  const name = cleanName(profile.name);
  return id && name ? { id, name } : null;
}

export function getConfiguredBasecampProfile(email, configuredProfiles = "") {
  const normalizedEmail = typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
  if (!normalizedEmail || !configuredProfiles.trim()) return null;

  try {
    const profiles = JSON.parse(configuredProfiles);
    if (!profiles || typeof profiles !== "object" || Array.isArray(profiles)) {
      return null;
    }
    return normalizeManagedBasecampProfile(profiles[normalizedEmail]);
  } catch {
    return null;
  }
}

export { FALLBACK_NAME as BASECAMP_FALLBACK_NAME };
