export const SESSION_STORAGE_KEY = "civic-voice-session";

function isSession(session) {
  return Boolean(
    session
      && typeof session.token === "string"
      && session.user
      && typeof session.user.nric === "string"
      && typeof session.user.name === "string"
      && ["citizen", "admin"].includes(session.user.role),
  );
}

export function loadSession() {
  try {
    const savedSession = globalThis.localStorage?.getItem(SESSION_STORAGE_KEY);
    if (!savedSession) return null;

    const session = JSON.parse(savedSession);
    return isSession(session) ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable in private browsing; keep the current session in memory.
  }
}

export function clearSession() {
  try {
    globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // There is no persisted session to clear when storage is unavailable.
  }
}
