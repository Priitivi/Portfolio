import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import LabGate from "./LabGate";
import LabHome from "./LabHome";
import { clearLabSession, readLabSession, unlockLab } from "./auth/labSession";
import "./lab.css";

const AudioReactor = lazy(() => import("./audio-reactor/AudioReactor"));

export default function LabApp() {
  const [authState, setAuthState] = useState("checking");
  const [serviceCode, setServiceCode] = useState(null);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Priit Lab // Restricted Development Zone";
    return () => { document.title = originalTitle; };
  }, []);

  useEffect(() => {
    let active = true;
    readLabSession()
      .then((result) => {
        if (!active) return;
        setServiceCode(result.code || null);
        setAuthState(result.authenticated ? "unlocked" : "locked");
      })
      .catch(() => {
        if (!active) return;
        setServiceCode("AUTH_SERVICE_UNAVAILABLE");
        setAuthState("locked");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((route) => {
    window.history.pushState({}, "", route);
    setPathname(route);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const authenticate = async (password) => {
    try {
      const result = await unlockLab(password);
      setServiceCode(result.code || null);
      if (result.authenticated) {
        window.setTimeout(() => setAuthState("unlocked"), 650);
      }
      return result;
    } catch {
      const result = { authenticated: false, code: "AUTH_SERVICE_UNAVAILABLE" };
      setServiceCode(result.code);
      return result;
    }
  };

  const logout = async () => {
    try { await clearLabSession(); } catch { /* cookie still expires shortly */ }
    setAuthState("locked");
    navigate("/lab");
  };

  if (authState === "checking") {
    return <main className="lab-boot" role="status"><div className="lab-scanlines" aria-hidden="true" /><span>PRIIT LAB</span><strong>VERIFYING CLEARANCE…</strong><i /></main>;
  }

  if (authState !== "unlocked") {
    return <LabGate onUnlock={authenticate} serviceCode={serviceCode} />;
  }

  if (pathname === "/lab/audio-reactor") {
    return (
      <Suspense fallback={<main className="lab-boot" role="status"><div className="lab-scanlines" aria-hidden="true" /><span>EXPERIMENT 001</span><strong>ENERGISING REACTOR…</strong><i /></main>}>
        <AudioReactor navigate={navigate} onLogout={logout} />
      </Suspense>
    );
  }

  return <LabHome navigate={navigate} onLogout={logout} />;
}
