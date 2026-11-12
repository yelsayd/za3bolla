import { randomUUID } from "node:crypto";
import {
  generateJoinCode,
  normalizeDisplayName,
  normalizeJoinCode,
  type Lobby,
  type Player,
} from "@za3bool/shared";

type LobbyListener = (lobby: Lobby) => void;

interface StoredLobby extends Lobby {
  listeners: Set<LobbyListener>;
}

function publicLobby(lobby: StoredLobby): Lobby {
  const { listeners: _listeners, ...rest } = lobby;
  return {
    ...rest,
    players: rest.players.map((player) => ({ ...player })),
  };
}

export class LobbyStore {
  private readonly byCode = new Map<string, StoredLobby>();

  create(displayName: string): { lobby: Lobby; playerId: string } {
    const name = normalizeDisplayName(displayName);
    const code = this.allocateCode();
    const playerId = randomUUID();
    const now = new Date().toISOString();
    const host: Player = {
      id: playerId,
      displayName: name,
      joinedAt: now,
      isHost: true,
    };

    const stored: StoredLobby = {
      id: randomUUID(),
      code,
      status: "open",
      createdAt: now,
      players: [host],
      listeners: new Set(),
    };

    this.byCode.set(code, stored);
    return { lobby: publicLobby(stored), playerId };
  }

  join(codeRaw: string, displayName: string): { lobby: Lobby; playerId: string } {
    const lobby = this.requireOpen(codeRaw);
    const name = normalizeDisplayName(displayName);

    const duplicate = lobby.players.some(
      (player) => player.displayName.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      throw new LobbyError(409, "That display name is already in this lobby.");
    }

    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      displayName: name,
      joinedAt: new Date().toISOString(),
      isHost: false,
    };

    lobby.players.push(player);
    this.emit(lobby);
    return { lobby: publicLobby(lobby), playerId };
  }

  get(codeRaw: string): Lobby {
    return publicLobby(this.require(codeRaw));
  }

  leave(codeRaw: string, playerId: string): Lobby | null {
    const code = normalizeJoinCode(codeRaw);
    const lobby = this.byCode.get(code);
    if (!lobby) {
      return null;
    }

    const index = lobby.players.findIndex((player) => player.id === playerId);
    if (index === -1) {
      return publicLobby(lobby);
    }

    const [removed] = lobby.players.splice(index, 1);
    if (lobby.players.length === 0) {
      this.byCode.delete(code);
      return null;
    }

    if (removed?.isHost) {
      lobby.players[0]!.isHost = true;
    }

    this.emit(lobby);
    return publicLobby(lobby);
  }

  subscribe(codeRaw: string, listener: LobbyListener): () => void {
    const lobby = this.require(codeRaw);
    lobby.listeners.add(listener);
    listener(publicLobby(lobby));
    return () => {
      lobby.listeners.delete(listener);
    };
  }

  private require(codeRaw: string): StoredLobby {
    const code = normalizeJoinCode(codeRaw);
    const lobby = this.byCode.get(code);
    if (!lobby) {
      throw new LobbyError(404, "Lobby not found.");
    }
    return lobby;
  }

  private requireOpen(codeRaw: string): StoredLobby {
    const lobby = this.require(codeRaw);
    if (lobby.status !== "open") {
      throw new LobbyError(409, "This lobby is closed.");
    }
    return lobby;
  }

  private allocateCode(): string {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const code = generateJoinCode();
      if (!this.byCode.has(code)) return code;
    }
    throw new LobbyError(503, "Could not allocate a join code. Try again.");
  }

  private emit(lobby: StoredLobby): void {
    const snapshot = publicLobby(lobby);
    for (const listener of lobby.listeners) {
      listener(snapshot);
    }
  }
}

export class LobbyError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LobbyError";
  }
}

export const lobbyStore = new LobbyStore();
