import type {
  CreateTaskMasterResponse,
  TaskMasterSession,
} from "@za3bolla/shared";

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function hostHeaders(hostToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Host-Token": hostToken,
  };
}

export async function createTaskMasterSession(): Promise<CreateTaskMasterResponse> {
  const response = await fetch("/api/taskmaster", { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CreateTaskMasterResponse>;
}

export async function fetchTaskMasterSession(
  sessionId: string,
): Promise<TaskMasterSession> {
  const response = await fetch(`/api/taskmaster/${encodeURIComponent(sessionId)}`);
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { session: TaskMasterSession };
  return data.session;
}

export async function addContestant(
  sessionId: string,
  hostToken: string,
  name: string,
): Promise<TaskMasterSession> {
  const response = await fetch(
    `/api/taskmaster/${encodeURIComponent(sessionId)}/contestants`,
    {
      method: "POST",
      headers: hostHeaders(hostToken),
      body: JSON.stringify({ name }),
    },
  );
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { session: TaskMasterSession };
  return data.session;
}

export async function renameContestant(
  sessionId: string,
  hostToken: string,
  contestantId: string,
  name: string,
): Promise<TaskMasterSession> {
  const response = await fetch(
    `/api/taskmaster/${encodeURIComponent(sessionId)}/contestants/${encodeURIComponent(contestantId)}`,
    {
      method: "PATCH",
      headers: hostHeaders(hostToken),
      body: JSON.stringify({ name }),
    },
  );
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { session: TaskMasterSession };
  return data.session;
}

export async function removeContestant(
  sessionId: string,
  hostToken: string,
  contestantId: string,
): Promise<TaskMasterSession> {
  const response = await fetch(
    `/api/taskmaster/${encodeURIComponent(sessionId)}/contestants/${encodeURIComponent(contestantId)}`,
    {
      method: "DELETE",
      headers: hostHeaders(hostToken),
    },
  );
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { session: TaskMasterSession };
  return data.session;
}

export async function recordRound(
  sessionId: string,
  hostToken: string,
  title: string,
  scores: { contestantId: string; points: number }[],
): Promise<TaskMasterSession> {
  const response = await fetch(
    `/api/taskmaster/${encodeURIComponent(sessionId)}/rounds`,
    {
      method: "POST",
      headers: hostHeaders(hostToken),
      body: JSON.stringify({ title: title.trim() || undefined, scores }),
    },
  );
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { session: TaskMasterSession };
  return data.session;
}

export async function endTaskMasterSession(
  sessionId: string,
  hostToken: string,
): Promise<void> {
  const response = await fetch(`/api/taskmaster/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: hostHeaders(hostToken),
    keepalive: true,
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(await readError(response));
  }
}

export function subscribeTaskMaster(
  sessionId: string,
  onSession: (session: TaskMasterSession) => void,
  onError: (message: string) => void,
): () => void {
  const source = new EventSource(
    `/api/taskmaster/${encodeURIComponent(sessionId)}/events`,
  );

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as {
        type: string;
        session?: TaskMasterSession;
        message?: string;
      };
      if (payload.type === "session" && payload.session) {
        onSession(payload.session);
        return;
      }
      if (payload.type === "error") {
        onError(payload.message ?? "Session stream error.");
      }
    } catch {
      onError("Could not parse session update.");
    }
  };

  source.onerror = () => {
    // Browser retries EventSource automatically.
  };

  return () => source.close();
}
