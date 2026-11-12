import type { Lobby } from "@za3bool/shared";

interface LobbyRoomProps {
  lobby: Lobby | null;
  playerId: string;
  error: string | null;
  onLeave: () => void;
}

export function LobbyRoom({ lobby, playerId, error, onLeave }: LobbyRoomProps) {
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
      <h1 className="join-code" aria-live="polite">
        {lobby.code}
      </h1>
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
