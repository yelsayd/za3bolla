import { useEffect, useState } from "react";
import type { Lobby } from "@za3bolla/shared";

interface LobbyRoomProps {
  lobby: Lobby | null;
  playerId: string;
  error: string | null;
  onLeave: () => void;
}

export function LobbyRoom({ lobby, playerId, error, onLeave }: LobbyRoomProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyCode() {
    if (!lobby) return;
    try {
      await navigator.clipboard.writeText(lobby.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!lobby) {
    return (
      <section className="panel">
        <h1>Connecting…</h1>
        <p className="lede">Loading lobby state.</p>
        {error ? <p className="error">{error}</p> : null}
        <button type="button" className="ghost" onClick={onLeave}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="panel lobby-panel">
      <p className="eyebrow">Lobby code</p>
      <div className="join-code-row">
        <h1 className="join-code" aria-live="polite">
          {lobby.code}
        </h1>
        <button
          type="button"
          className="copy-code-btn"
          onClick={() => void handleCopyCode()}
          aria-label={copied ? "Join code copied" : "Copy join code"}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="lede">Share this code. Players appear here as they join.</p>

      {error ? <p className="error">{error}</p> : null}

      <ul className="player-list" aria-live="polite">
        {lobby.players.map((player) => {
          const isYou = player.id === playerId;
          return (
            <li key={player.id} className={isYou ? "you" : undefined}>
              <span className="player-name">{player.displayName}</span>
              <span className="player-meta">
                {player.isHost ? "Host" : "Player"}
                {isYou ? " · you" : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <button type="button" className="ghost" onClick={onLeave}>
        Leave lobby
      </button>
    </section>
  );
}
