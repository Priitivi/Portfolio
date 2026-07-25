const BASECAMP_ROLE = "basecamp";
const ALLOWLIST_KEY = "BASECAMP_ALLOWED_EMAILS";

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

function denyUnknownUser(event) {
  if (!isAllowedUser(event.user)) {
    return event.deny();
  }

  return undefined;
}

export default {
  userValidate: denyUnknownUser,
  userLogin: denyUnknownUser,
  userModified: denyUnknownUser,

  userSignup(event) {
    if (!isAllowedUser(event.user)) {
      return event.deny();
    }

    const existingRoles = Array.isArray(event.user.appMetadata?.roles)
      ? event.user.appMetadata.roles
      : [];

    return {
      user: {
        ...event.user,
        appMetadata: {
          ...event.user.appMetadata,
          roles: [...new Set([...existingRoles, BASECAMP_ROLE])],
        },
      },
    };
  },
};
