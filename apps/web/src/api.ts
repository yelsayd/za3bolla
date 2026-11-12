import type { Lobby, LobbySessionResponse } from "@za3bolla/shared";
import { apiUrl } from "./config";

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function createLobby(displayName: string): Promise<LobbySessionResponse> {
  const response = await fetch(apiUrl("/api/lobbies"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<LobbySessionResponse>;
}

export async function joinLobby(
  code: string,
  displayName: string,
): Promise<LobbySessionResponse> {
  const response = await fetch(apiUrl(`/api/lobbies/${encodeURIComponent(code)}/join`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<LobbySessionResponse>;
}

/** Remove this player from the lobby. Uses keepalive so tab close still delivers. */
export function leaveLobby(code: string, playerId: string): Promise<void> {
  return fetch(apiUrl(`/api/lobbies/${encodeURIComponent(code)}/leave`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
    keepalive: true,
  }).then(async (response) => {
    if (!response.ok) throw new Error(await readError(response));
  });
}

export function subscribeLobby(
  code: string,
  onLobby: (lobby: Lobby) => void,
  onError: (message: string) => void,
): () => void {
  const source = new EventSource(apiUrl(`/api/lobbies/${encodeURIComponent(code)}/events`));

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as {
        type: string;
        lobby?: Lobby;
        message?: string;
      };
      if (payload.type === "lobby" && payload.lobby) {
        onLobby(payload.lobby);
        return;
      }
      if (payload.type === "error") {
        onError(payload.message ?? "Lobby stream error.");
      }
    } catch {
      onError("Could not parse lobby update.");
    }
  };

  source.onerror = () => {
    // Browser will retry EventSource automatically.
  };

  return () => source.close();
}
