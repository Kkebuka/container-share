import type { Session } from "@/types";

const SESSIONS_KEY = "containershare_sessions_v1";
const DRAFT_KEY = "containershare_draft_v1";
const VERSION_KEY = "containershare_version";
const APP_VERSION = "1.0.0";

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed: Session[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Failed to load sessions from localStorage");
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  } catch {
    throw new Error("STORAGE_FULL");
  }
}

export function saveSession(
  session: Session,
  allSessions: Session[],
): Session[] {
  const idx = allSessions.findIndex((s) => s.id === session.id);
  const next =
    idx >= 0
      ? allSessions.map((s) => (s.id === session.id ? session : s))
      : [session, ...allSessions];
  saveSessions(next);
  return next;
}

export function deleteSession(
  sessionId: string,
  allSessions: Session[],
): Session[] {
  const next = allSessions.filter((s) => s.id !== sessionId);
  saveSessions(next);
  return next;
}

// ─── Draft ────────────────────────────────────────────────────────────────────

export function saveDraft(session: Session): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(session));
  } catch {
    /* silent — draft save is best-effort */
  }
}

export function loadDraft(): Session | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// ─── localStorage availability check ─────────────────────────────────────────

export function isStorageAvailable(): boolean {
  try {
    const test = "__cs_test__";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
