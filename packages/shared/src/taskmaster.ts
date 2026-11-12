/** Contestant managed by the TaskMaster host (no device required). */
export interface Contestant {
  id: string;
  name: string;
  createdAt: string;
}

export interface RoundScore {
  contestantId: string;
  points: number;
}

/** One scored task/round entered by the host. */
export interface TaskRound {
  id: string;
  /** Free-text or default "Round N". */
  title: string;
  scores: RoundScore[];
  createdAt: string;
}

export interface TaskMasterSession {
  id: string;
  createdAt: string;
  contestants: Contestant[];
  rounds: TaskRound[];
}

export interface CreateTaskMasterResponse {
  session: TaskMasterSession;
  /** Required on host mutations; keep client-side only. */
  hostToken: string;
}

export interface AddContestantRequest {
  name: string;
}

export interface RenameContestantRequest {
  name: string;
}

export interface RecordRoundRequest {
  /** Optional; defaults to "Round N" on the server. */
  title?: string;
  scores: RoundScore[];
}

export interface LeaderboardEntry {
  contestantId: string;
  name: string;
  total: number;
}

const CONTESTANT_NAME_MAX = 24;
const ROUND_TITLE_MAX = 80;

export function normalizeContestantName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateContestantName(raw: string): string | null {
  const name = normalizeContestantName(raw);
  if (!name) return "Contestant name is required.";
  if (name.length > CONTESTANT_NAME_MAX) {
    return `Contestant name must be ${CONTESTANT_NAME_MAX} characters or fewer.`;
  }
  return null;
}

export function normalizeRoundTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateRoundTitle(raw: string): string | null {
  const title = normalizeRoundTitle(raw);
  if (!title) return "Round title is required.";
  if (title.length > ROUND_TITLE_MAX) {
    return `Round title must be ${ROUND_TITLE_MAX} characters or fewer.`;
  }
  return null;
}

/** Running totals sorted high → low (stable by name on ties). */
export function buildLeaderboard(session: TaskMasterSession): LeaderboardEntry[] {
  const totals = new Map<string, number>();
  for (const contestant of session.contestants) {
    totals.set(contestant.id, 0);
  }
  for (const round of session.rounds) {
    for (const score of round.scores) {
      if (!totals.has(score.contestantId)) continue;
      totals.set(score.contestantId, (totals.get(score.contestantId) ?? 0) + score.points);
    }
  }

  return session.contestants
    .map((contestant) => ({
      contestantId: contestant.id,
      name: contestant.name,
      total: totals.get(contestant.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });
}
