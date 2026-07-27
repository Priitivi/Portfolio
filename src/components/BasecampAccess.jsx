import { useEffect, useState } from "react";
import {
  acceptInvite,
  getUser,
  handleAuthCallback,
  login,
  logout,
  refreshSession,
  requestPasswordRecovery,
  updateUser,
} from "@netlify/identity";
import { hasBasecampDisplayName } from "../utils/basecampIdentity";
import "./BasecampAccess.css";

function hasBasecampRole(user) {
  return Array.isArray(user?.roles) && user.roles.includes("basecamp");
}

function getErrorMessage(error) {
  if (error?.name === "MissingIdentityError") {
    return "Private access is not enabled on this preview yet.";
  }

  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function BasecampAccess() {
  const [mode, setMode] = useState("loading");
  const [inviteToken, setInviteToken] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initialiseAccess() {
      try {
        const callback = await handleAuthCallback();
        if (!isMounted) return;

        if (callback?.type === "invite" && callback.token) {
          setInviteToken(callback.token);
          setMode("invite");
          return;
        }

        if (callback?.type === "recovery") {
          setMode("recovery");
          return;
        }

        const user = callback?.user ?? await getUser();
        if (!isMounted) return;

        if (hasBasecampRole(user)) {
          if (!hasBasecampDisplayName(user)) {
            setMode("profile");
            return;
          }
          window.location.replace("/basecamp");
          return;
        }

        if (user) {
          await logout();
          if (!isMounted) return;
          setError("This account is not on the Basecamp guest list.");
        }

        setMode("login");
      } catch (initialiseError) {
        if (!isMounted) return;
        setError(getErrorMessage(initialiseError));
        setMode("login");
      }
    }

    initialiseAccess();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (!hasBasecampRole(user)) {
        await logout();
        throw new Error("This account is not on the Basecamp guest list.");
      }
      if (!hasBasecampDisplayName(user)) {
        setMode("profile");
        setSubmitting(false);
        return;
      }
      window.location.assign("/basecamp");
    } catch (loginError) {
      setError(getErrorMessage(loginError));
      setSubmitting(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!displayName.trim()) {
      setError("Enter the name the crew should see.");
      return;
    }

    if (password.length < 10) {
      setError("Choose a password with at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite(inviteToken, password);
      await updateUser({ data: { full_name: displayName.trim() } });
      await refreshSession();
      window.location.assign("/basecamp");
    } catch (inviteError) {
      setError(getErrorMessage(inviteError));
      setSubmitting(false);
    }
  };

  const handleProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!displayName.trim()) {
      setError("Enter the name the crew should see.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUser({ data: { full_name: displayName.trim() } });
      await refreshSession();
      window.location.assign("/basecamp");
    } catch (profileError) {
      setError(getErrorMessage(profileError));
      setSubmitting(false);
    }
  };

  const handleRecovery = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 10) {
      setError("Choose a password with at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUser({ password });
      window.location.assign("/basecamp");
    } catch (recoveryError) {
      setError(getErrorMessage(recoveryError));
      setSubmitting(false);
    }
  };

  const sendRecoveryEmail = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your invited email address first.");
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordRecovery(email.trim().toLowerCase());
      setMessage("Recovery email sent. Check your inbox.");
    } catch (recoveryError) {
      setError(getErrorMessage(recoveryError));
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "invite"
    ? "Join the crew."
    : mode === "profile"
      ? "Complete your crew profile."
    : mode === "recovery"
      ? "Set a new password."
      : "Crew access only.";

  return (
    <main className="basecamp-access-shell">
      <section className="basecamp-access-art" aria-label="Durdle Basecamp 2026">
        <img
          src="/basecamp-og.png"
          alt="Durdle Basecamp, 21–23 August 2026"
          fetchPriority="high"
        />
      </section>

      <section className="basecamp-access-panel">
        <a className="basecamp-access-back" href="/">← Priitivi’s portfolio</a>
        <div className="basecamp-access-lock" aria-hidden="true">DB</div>
        <span className="basecamp-access-kicker">Invite-only expedition</span>
        <h1>{title}</h1>

        {mode === "loading" ? (
          <div className="basecamp-access-loading" role="status">
            <span />
            Checking your invitation…
          </div>
        ) : (
          <>
            <p className="basecamp-access-intro">
              {mode === "profile"
                ? "Add the name your crew should see in voting, chat and shared plans."
                : "This planning room is reserved for the Durdle Basecamp crew. Use the exact email address that received an invitation."}
            </p>

            {error && <p className="basecamp-access-alert is-error" role="alert">{error}</p>}
            {message && <p className="basecamp-access-alert is-success" role="status">{message}</p>}

            {mode === "login" && (
              <form className="basecamp-access-form" onSubmit={handleLogin}>
                <label>
                  <span>Invited email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Checking access…" : "Enter Basecamp"}
                </button>
                <button
                  className="basecamp-access-recovery"
                  type="button"
                  disabled={submitting}
                  onClick={sendRecoveryEmail}
                >
                  Forgot your password?
                </button>
              </form>
            )}

            {(mode === "invite" || mode === "recovery") && (
              <form
                className="basecamp-access-form"
                onSubmit={mode === "invite" ? handleInvite : handleRecovery}
              >
                {mode === "invite" && (
                  <label>
                    <span>Your name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength="40"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                    />
                  </label>
                )}
                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength="10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength="10"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </label>
                <button type="submit" disabled={submitting}>
                  {submitting
                    ? "Securing your place…"
                    : mode === "invite"
                      ? "Accept invitation"
                      : "Save new password"}
                </button>
              </form>
            )}

            {mode === "profile" && (
              <form className="basecamp-access-form" onSubmit={handleProfile}>
                <label>
                  <span>Your name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength="40"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    autoFocus
                  />
                </label>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Saving your profile…" : "Continue to Basecamp"}
                </button>
              </form>
            )}

            <small className="basecamp-access-note">
              No public registration. Access can be removed at any time by the trip host.
            </small>
          </>
        )}
      </section>
    </main>
  );
}

export default BasecampAccess;
