const STORAGE_KEY = "za3bolla.taskMasterHost";

export interface TaskMasterHostSession {
  sessionId: string;
  hostToken: string;
}

export function saveTaskMasterHost(session: TaskMasterHostSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadTaskMasterHost(): TaskMasterHostSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TaskMasterHostSession;
    if (!parsed.sessionId || !parsed.hostToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearTaskMasterHost(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
