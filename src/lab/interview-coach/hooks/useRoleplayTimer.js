import { useEffect } from "react";

export default function useRoleplayTimer(running, onTick) {
  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(onTick, 1000);
    return () => window.clearInterval(interval);
  }, [onTick, running]);
}
