import { getConfiguredBasecampProfile } from "../../src/utils/basecampIdentity.js";

const BASECAMP_ROLE = "basecamp";
const ALLOWLIST_KEY = "BASECAMP_ALLOWED_EMAILS";
const MEMBER_PROFILES_KEY = "BASECAMP_MEMBER_PROFILES";

function normaliseEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAllowedEmails() {
  const configuredEmails = Netlify.env.get(ALLOWLIST_KEY) ?? "";
  return new Set(
    configuredEmails
      .split(",")
      .map(normaliseEmail)
      .filter(Boolean),
  );
}

function isAllowedUser(user) {
  const email = normaliseEmail(user?.email);
  return Boolean(email) && getAllowedEmails().has(email);
}

export function getConfiguredMemberProfile(email, configuredProfiles = "") {
  return getConfiguredBasecampProfile(email, configuredProfiles);
}

function withBasecampMetadata(user) {
  const existingRoles = Array.isArray(user.appMetadata?.roles)
    ? user.appMetadata.roles
    : [];
  const configuredProfile = getConfiguredMemberProfile(
    user.email,
    Netlify.env.get(MEMBER_PROFILES_KEY) ?? "",
  );

  return {
    ...user,
    appMetadata: {
      ...user.appMetadata,
      roles: [...new Set([...existingRoles, BASECAMP_ROLE])],
      ...(configuredProfile
        ? {
          basecampId: configuredProfile.id,
          basecampName: configuredProfile.name,
        }
        : {}),
    },
  };
}

function denyUnknownUser(event) {
  if (!isAllowedUser(event.user)) {
    return event.deny();
  }

  return undefined;
}

export default {
  userValidate: denyUnknownUser,
  userLogin: denyUnknownUser,
  userModified(event) {
    if (!isAllowedUser(event.user)) {
      return event.deny();
    }

    return { user: withBasecampMetadata(event.user) };
  },

  userSignup(event) {
    if (!isAllowedUser(event.user)) {
      return event.deny();
    }

    return { user: withBasecampMetadata(event.user) };
  },
};
