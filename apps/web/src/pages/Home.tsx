import { useState, type FormEvent } from "react";

interface HomeProps {
  busy: boolean;
  error: string | null;
  onStartTaskMaster: () => Promise<void>;
  onCreateLobby: (displayName: string) => Promise<void>;
  onJoinLobby: (code: string, displayName: string) => Promise<void>;
}

export function Home({
  busy,
  error,
  onStartTaskMaster,
  onCreateLobby,
  onJoinLobby,
}: HomeProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [showLobby, setShowLobby] = useState(false);

  async function handleLobbySubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "create") {
      await onCreateLobby(displayName);
      return;
    }
    await onJoinLobby(code, displayName);
  }

  return (
    <div className="home-stack">
      <section className="panel home-panel">
        <p className="eyebrow">za3bolla</p>
        <h1>Play together</h1>
        <p className="lede">
          Host-friendly family games. Start TaskMaster on one device — contestants
          need nothing but the room.
        </p>

        {error && !showLobby ? <p className="error">{error}</p> : null}

        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={() => void onStartTaskMaster()}
        >
          {busy && !showLobby ? "Starting…" : "Start TaskMaster"}
        </button>
        <p className="game-blurb">
          Host adds names, scores each round, and watches the leaderboard climb.
        </p>
      </section>

      <section className="panel lobby-entry">
        <button
          type="button"
          className="text-btn lobby-toggle"
          onClick={() => setShowLobby((open) => !open)}
          aria-expanded={showLobby}
        >
          {showLobby ? "Hide lobby tools" : "Open a shared lobby"}
        </button>

        {showLobby ? (
          <>
            <p className="lede tight">
              Create or join a short-code lobby for device-based games (platform
              tooling).
            </p>

            <div className="mode-toggle" role="tablist" aria-label="Lobby action">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "create"}
                className={mode === "create" ? "active" : ""}
                onClick={() => setMode("create")}
                disabled={busy}
              >
                Create
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "join"}
                className={mode === "join" ? "active" : ""}
                onClick={() => setMode("join")}
                disabled={busy}
              >
                Join
              </button>
            </div>

            <form className="stack-form" onSubmit={handleLobbySubmit}>
              <label>
                Display name
                <input
                  name="displayName"
                  autoComplete="nickname"
                  maxLength={24}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  required
                  disabled={busy}
                />
              </label>

              {mode === "join" ? (
                <label>
                  Join code
                  <input
                    name="code"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={8}
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="ABCD"
                    required
                    disabled={busy}
                  />
                </label>
              ) : null}

              {error && showLobby ? <p className="error">{error}</p> : null}

              <button type="submit" className="primary" disabled={busy}>
                {busy
                  ? "Working…"
                  : mode === "create"
                    ? "Create lobby"
                    : "Join lobby"}
              </button>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}
