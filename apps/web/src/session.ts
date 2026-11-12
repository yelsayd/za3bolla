const STORAGE_KEY = "za3bool.lobbySession";

export interface LocalSession {
  code: string;
  playerId: string;
  displayName: string;
}

export function saveSession(session: LocalSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): LocalSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
