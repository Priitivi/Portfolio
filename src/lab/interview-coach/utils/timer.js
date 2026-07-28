export const ROLEPLAY_DURATION_SECONDS = 10 * 60;

export function createTimerState() {
  return {
    remainingSeconds: ROLEPLAY_DURATION_SECONDS,
    running: false,
    expired: false,
  };
}

export function advanceTimer(timer, seconds = 1) {
  if (!timer.running || timer.expired) return timer;
  const remainingSeconds = Math.max(0, timer.remainingSeconds - Math.max(0, seconds));
  return {
    remainingSeconds,
    running: remainingSeconds > 0,
    expired: remainingSeconds === 0,
  };
}

export function setTimerRunning(timer, running) {
  if (timer.expired) return timer;
  return { ...timer, running };
}

export function formatTimer(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
