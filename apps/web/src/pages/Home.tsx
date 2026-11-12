import { useState, type FormEvent } from "react";

interface HomeProps {
  busy: boolean;
  error: string | null;
  onCreate: (displayName: string) => Promise<void>;
  onJoin: (code: string, displayName: string) => Promise<void>;
}

export function Home({ busy, error, onCreate, onJoin }: HomeProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "create") {
      await onCreate(displayName);
      return;
    }
    await onJoin(code, displayName);
  }

  return (
    <section className="panel home-panel">
      <h1>Family lobby</h1>
      <p className="lede">
        Create a short code, share it, and gather everyone on their own phone.
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

      <form className="stack-form" onSubmit={handleSubmit}>
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

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Working…" : mode === "create" ? "Create lobby" : "Join lobby"}
        </button>
      </form>
    </section>
  );
}
