export type LobbyStatus = "open" | "closed";

export interface Player {
  id: string;
  displayName: string;
  joinedAt: string;
  /** First player who created the lobby. */
  isHost: boolean;
}

export interface Lobby {
  id: string;
  /** Short code others use to join. */
  code: string;
  status: LobbyStatus;
  createdAt: string;
  players: Player[];
}

export interface CreateLobbyRequest {
  displayName: string;
}

export interface JoinLobbyRequest {
  displayName: string;
}

export interface LobbySessionResponse {
  lobby: Lobby;
  playerId: string;
}

export type LobbyEvent =
  | { type: "lobby"; lobby: Lobby }
  | { type: "error"; message: string };

const DISPLAY_NAME_MAX = 24;

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(raw: string): string | null {
  const name = normalizeDisplayName(raw);
  if (!name) return "Display name is required.";
  if (name.length > DISPLAY_NAME_MAX) {
    return `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`;
  }
  return null;
}
