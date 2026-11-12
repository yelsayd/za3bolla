import { randomUUID } from "node:crypto";
import {
  normalizeContestantName,
  normalizeRoundTitle,
  type Contestant,
  type RoundScore,
  type TaskMasterSession,
  type TaskRound,
} from "@za3bool/shared";

type SessionListener = (session: TaskMasterSession) => void;

interface StoredSession extends TaskMasterSession {
  hostToken: string;
  listeners: Set<SessionListener>;
}

function publicSession(session: StoredSession): TaskMasterSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    contestants: session.contestants.map((c) => ({ ...c })),
    rounds: session.rounds.map((round) => ({
      ...round,
      scores: round.scores.map((score) => ({ ...score })),
    })),
  };
}

export class TaskMasterStore {
  private readonly byId = new Map<string, StoredSession>();

  create(): { session: TaskMasterSession; hostToken: string } {
    const id = randomUUID();
    const hostToken = randomUUID();
    const stored: StoredSession = {
      id,
      hostToken,
      createdAt: new Date().toISOString(),
      contestants: [],
      rounds: [],
      listeners: new Set(),
    };
    this.byId.set(id, stored);
    return { session: publicSession(stored), hostToken };
  }

  get(sessionId: string): TaskMasterSession {
    return publicSession(this.require(sessionId));
  }

  requireHost(sessionId: string, hostToken: string): StoredSession {
    const session = this.require(sessionId);
    if (session.hostToken !== hostToken) {
      throw new TaskMasterError(403, "Host token is invalid.");
    }
    return session;
  }

  addContestant(sessionId: string, hostToken: string, nameRaw: string): TaskMasterSession {
    const session = this.requireHost(sessionId, hostToken);
    const name = normalizeContestantName(nameRaw);
    this.assertUniqueName(session, name);

    const contestant: Contestant = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    session.contestants.push(contestant);
    this.emit(session);
    return publicSession(session);
  }

  renameContestant(
    sessionId: string,
    hostToken: string,
    contestantId: string,
    nameRaw: string,
  ): TaskMasterSession {
    const session = this.requireHost(sessionId, hostToken);
    const contestant = session.contestants.find((c) => c.id === contestantId);
    if (!contestant) {
      throw new TaskMasterError(404, "Contestant not found.");
    }

    const name = normalizeContestantName(nameRaw);
    this.assertUniqueName(session, name, contestantId);
    contestant.name = name;
    this.emit(session);
    return publicSession(session);
  }

  removeContestant(
    sessionId: string,
    hostToken: string,
    contestantId: string,
  ): TaskMasterSession {
    const session = this.requireHost(sessionId, hostToken);
    const index = session.contestants.findIndex((c) => c.id === contestantId);
    if (index === -1) {
      throw new TaskMasterError(404, "Contestant not found.");
    }

    session.contestants.splice(index, 1);
    for (const round of session.rounds) {
      round.scores = round.scores.filter((score) => score.contestantId !== contestantId);
    }
    this.emit(session);
    return publicSession(session);
  }

  recordRound(
    sessionId: string,
    hostToken: string,
    titleRaw: string | undefined,
    scores: RoundScore[],
  ): TaskMasterSession {
    const session = this.requireHost(sessionId, hostToken);
    if (session.contestants.length === 0) {
      throw new TaskMasterError(400, "Add at least one contestant before scoring.");
    }

    const title =
      titleRaw && normalizeRoundTitle(titleRaw)
        ? normalizeRoundTitle(titleRaw)
        : `Round ${session.rounds.length + 1}`;

    const byId = new Map(session.contestants.map((c) => [c.id, c]));
    const normalized: RoundScore[] = [];
    const seen = new Set<string>();

    for (const score of scores) {
      if (!byId.has(score.contestantId)) {
        throw new TaskMasterError(400, "Score references an unknown contestant.");
      }
      if (seen.has(score.contestantId)) {
        throw new TaskMasterError(400, "Duplicate score for the same contestant.");
      }
      if (!Number.isFinite(score.points) || !Number.isInteger(score.points)) {
        throw new TaskMasterError(400, "Points must be whole numbers.");
      }
      if (score.points < -999 || score.points > 999) {
        throw new TaskMasterError(400, "Points must be between -999 and 999.");
      }
      seen.add(score.contestantId);
      normalized.push({ contestantId: score.contestantId, points: score.points });
    }

    for (const contestant of session.contestants) {
      if (!seen.has(contestant.id)) {
        throw new TaskMasterError(400, `Missing points for ${contestant.name}.`);
      }
    }

    const round: TaskRound = {
      id: randomUUID(),
      title,
      scores: normalized,
      createdAt: new Date().toISOString(),
    };
    session.rounds.push(round);
    this.emit(session);
    return publicSession(session);
  }

  end(sessionId: string, hostToken: string): void {
    const session = this.requireHost(sessionId, hostToken);
    this.byId.delete(session.id);
    for (const listener of session.listeners) {
      // Clients treating missing GET as ended; no further events.
      void listener;
    }
    session.listeners.clear();
  }

  subscribe(sessionId: string, listener: SessionListener): () => void {
    const session = this.require(sessionId);
    session.listeners.add(listener);
    listener(publicSession(session));
    return () => {
      session.listeners.delete(listener);
    };
  }

  private require(sessionId: string): StoredSession {
    const session = this.byId.get(sessionId.trim());
    if (!session) {
      throw new TaskMasterError(404, "TaskMaster session not found.");
    }
    return session;
  }

  private assertUniqueName(
    session: StoredSession,
    name: string,
    exceptId?: string,
  ): void {
    const duplicate = session.contestants.some(
      (c) =>
        c.id !== exceptId && c.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      throw new TaskMasterError(409, "That contestant name is already in use.");
    }
  }

  private emit(session: StoredSession): void {
    const snapshot = publicSession(session);
    for (const listener of session.listeners) {
      listener(snapshot);
    }
  }
}

export class TaskMasterError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TaskMasterError";
  }
}

export const taskMasterStore = new TaskMasterStore();
