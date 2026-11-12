import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  buildLeaderboard,
  type Contestant,
  type TaskMasterSession,
} from "@za3bolla/shared";
import {
  addContestant,
  recordRound,
  removeContestant,
  renameContestant,
} from "../taskMasterApi";

interface TaskMasterHostProps {
  session: TaskMasterSession | null;
  sessionId: string;
  hostToken: string;
  busy: boolean;
  error: string | null;
  onSession: (session: TaskMasterSession) => void;
  onError: (message: string | null) => void;
  onBusy: (busy: boolean) => void;
  onEnd: () => void;
}

export function TaskMasterHost({
  session,
  sessionId,
  hostToken,
  busy,
  error,
  onSession,
  onError,
  onBusy,
  onEnd,
}: TaskMasterHostProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [roundTitle, setRoundTitle] = useState("");
  const [pointsById, setPointsById] = useState<Record<string, string>>({});

  const leaderboard = useMemo(
    () => (session ? buildLeaderboard(session) : []),
    [session],
  );

  const nextRoundLabel = session ? `Round ${session.rounds.length + 1}` : "Round 1";

  useEffect(() => {
    if (!session) return;
    setPointsById((prev) => {
      const next: Record<string, string> = {};
      for (const contestant of session.contestants) {
        next[contestant.id] = prev[contestant.id] ?? "0";
      }
      return next;
    });
  }, [session]);

  async function run(action: () => Promise<TaskMasterSession>) {
    onBusy(true);
    onError(null);
    try {
      onSession(await action());
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      onBusy(false);
    }
  }

  async function handleAddContestant(event: FormEvent) {
    event.preventDefault();
    const name = newName;
    await run(() => addContestant(sessionId, hostToken, name));
    setNewName("");
  }

  async function handleRename(contestant: Contestant) {
    await run(() => renameContestant(sessionId, hostToken, contestant.id, editName));
    setEditingId(null);
  }

  async function handleRemove(contestantId: string) {
    await run(() => removeContestant(sessionId, hostToken, contestantId));
  }

  async function handleRecordRound(event: FormEvent) {
    event.preventDefault();
    if (!session) return;

    const scores = session.contestants.map((contestant) => {
      const raw = pointsById[contestant.id] ?? "0";
      const points = Number.parseInt(raw, 10);
      return { contestantId: contestant.id, points: Number.isFinite(points) ? points : NaN };
    });

    if (scores.some((score) => !Number.isFinite(score.points))) {
      onError("Enter whole-number points for every contestant.");
      return;
    }

    await run(() =>
      recordRound(sessionId, hostToken, roundTitle || nextRoundLabel, scores),
    );
    setRoundTitle("");
    setPointsById((prev) => {
      const reset: Record<string, string> = {};
      for (const id of Object.keys(prev)) reset[id] = "0";
      return reset;
    });
  }

  if (!session) {
    return (
      <section className="panel">
        <h1>Connecting…</h1>
        <p className="lede">Loading TaskMaster session.</p>
        {error ? <p className="error">{error}</p> : null}
        <button type="button" className="ghost" onClick={onEnd}>
          Back
        </button>
      </section>
    );
  }

  return (
    <div className="host-layout">
      <section className="panel host-hero">
        <p className="eyebrow">Host console</p>
        <h1>TaskMaster</h1>
        <p className="lede">
          Add contestants, announce each task in person, then enter points. No phones
          needed for players.
        </p>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Contestants</h2>
        <form className="inline-form" onSubmit={handleAddContestant}>
          <label className="grow">
            Name
            <input
              value={newName}
              maxLength={24}
              placeholder="Add a contestant"
              onChange={(event) => setNewName(event.target.value)}
              disabled={busy}
              required
            />
          </label>
          <button type="submit" className="primary compact" disabled={busy}>
            Add
          </button>
        </form>

        {session.contestants.length === 0 ? (
          <p className="empty-hint">No contestants yet — add everyone before round one.</p>
        ) : (
          <ul className="contestant-list">
            {session.contestants.map((contestant) => {
              const isEditing = editingId === contestant.id;
              return (
                <li key={contestant.id}>
                  {isEditing ? (
                    <form
                      className="inline-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleRename(contestant);
                      }}
                    >
                      <input
                        className="grow"
                        value={editName}
                        maxLength={24}
                        onChange={(event) => setEditName(event.target.value)}
                        disabled={busy}
                        required
                        autoFocus
                      />
                      <button type="submit" className="primary compact" disabled={busy}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="ghost compact"
                        disabled={busy}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="player-name">{contestant.name}</span>
                      <span className="row-actions">
                        <button
                          type="button"
                          className="text-btn"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(contestant.id);
                            setEditName(contestant.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="text-btn danger"
                          disabled={busy}
                          onClick={() => void handleRemove(contestant.id)}
                        >
                          Remove
                        </button>
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Score a round</h2>
        <p className="section-note">
          Tell contestants the task out loud, then record points when they finish.
        </p>
        <form className="stack-form" onSubmit={handleRecordRound}>
          <label>
            Round title
            <input
              value={roundTitle}
              maxLength={80}
              placeholder={nextRoundLabel}
              onChange={(event) => setRoundTitle(event.target.value)}
              disabled={busy || session.contestants.length === 0}
            />
          </label>

          {session.contestants.map((contestant) => (
            <label key={contestant.id} className="points-row">
              <span>{contestant.name}</span>
              <input
                type="number"
                inputMode="numeric"
                step={1}
                min={-999}
                max={999}
                value={pointsById[contestant.id] ?? "0"}
                onChange={(event) =>
                  setPointsById((prev) => ({
                    ...prev,
                    [contestant.id]: event.target.value,
                  }))
                }
                disabled={busy}
                required
              />
            </label>
          ))}

          <button
            type="submit"
            className="primary"
            disabled={busy || session.contestants.length === 0}
          >
            {busy ? "Saving…" : "Record scores"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="empty-hint">Totals appear once contestants are added.</p>
        ) : (
          <ol className="leaderboard">
            {leaderboard.map((entry, index) => (
              <li key={entry.contestantId}>
                <span className="rank">{index + 1}</span>
                <span className="player-name">{entry.name}</span>
                <span className="points">{entry.total}</span>
              </li>
            ))}
          </ol>
        )}

        {session.rounds.length > 0 ? (
          <div className="round-history">
            <h3>Rounds scored</h3>
            <ul>
              {session.rounds
                .slice()
                .reverse()
                .map((round) => (
                  <li key={round.id}>
                    <strong>{round.title}</strong>
                    <span className="player-meta">
                      {round.scores
                        .map((score) => {
                          const name =
                            session.contestants.find((c) => c.id === score.contestantId)
                              ?.name ?? "?";
                          return `${name} ${score.points >= 0 ? "+" : ""}${score.points}`;
                        })
                        .join(" · ")}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </section>

      <button type="button" className="ghost end-session" onClick={onEnd} disabled={busy}>
        End session
      </button>
    </div>
  );
}
