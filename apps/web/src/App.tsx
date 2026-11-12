import { useEffect, useRef, useState } from "react";
import type { Lobby } from "@za3bool/shared";
import { createLobby, joinLobby, leaveLobby, subscribeLobby } from "./api";
import { clearSession, loadSession, saveSession } from "./session";
import { Home } from "./pages/Home";
import { LobbyRoom } from "./pages/LobbyRoom";

type Screen =
  | { name: "home" }
  | { name: "lobby"; code: string; playerId: string };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    const existing = loadSession();
    if (existing) {
      setScreen({
        name: "lobby",
        code: existing.code,
        playerId: existing.playerId,
      });
    }
  }, []);

  useEffect(() => {
    if (screen.name !== "lobby") return;

    const unsubscribe = subscribeLobby(
      screen.code,
      (next) => {
        setLobby(next);
        setError(null);
      },
      (message) => setError(message),
    );

    return unsubscribe;
  }, [screen]);

  useEffect(() => {
    function notifyLeaveOnUnload() {
      const current = screenRef.current;
      if (current.name !== "lobby") return;
      void leaveLobby(current.code, current.playerId);
      clearSession();
    }

    window.addEventListener("pagehide", notifyLeaveOnUnload);
    return () => window.removeEventListener("pagehide", notifyLeaveOnUnload);
  }, []);

  async function handleCreate(displayName: string) {
    setBusy(true);
    setError(null);
    try {
      const session = await createLobby(displayName);
      saveSession({
        code: session.lobby.code,
        playerId: session.playerId,
        displayName,
      });
      setLobby(session.lobby);
      setScreen({
        name: "lobby",
        code: session.lobby.code,
        playerId: session.playerId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lobby.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(code: string, displayName: string) {
    setBusy(true);
    setError(null);
    try {
      const session = await joinLobby(code, displayName);
      saveSession({
        code: session.lobby.code,
        playerId: session.playerId,
        displayName,
      });
      setLobby(session.lobby);
      setScreen({
        name: "lobby",
        code: session.lobby.code,
        playerId: session.playerId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join lobby.");
    } finally {
      setBusy(false);
    }
  }

  function handleLeave() {
    const current = screenRef.current;
    if (current.name === "lobby") {
      void leaveLobby(current.code, current.playerId);
    }
    clearSession();
    setLobby(null);
    setError(null);
    setScreen({ name: "home" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <p className="brand">za3bool.land</p>
      </header>

      <main className="stage">
        {screen.name === "home" ? (
          <Home busy={busy} error={error} onCreate={handleCreate} onJoin={handleJoin} />
        ) : (
          <LobbyRoom
            lobby={lobby}
            playerId={screen.playerId}
            error={error}
            onLeave={handleLeave}
          />
        )}
      </main>
    </div>
  );
}
