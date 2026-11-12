import { useEffect, useRef, useState } from "react";
import type { Lobby, TaskMasterSession } from "@za3bolla/shared";
import { createLobby, joinLobby, leaveLobby, subscribeLobby } from "./api";
import { clearSession, loadSession, saveSession } from "./session";
import {
  createTaskMasterSession,
  endTaskMasterSession,
  subscribeTaskMaster,
} from "./taskMasterApi";
import {
  clearTaskMasterHost,
  loadTaskMasterHost,
  saveTaskMasterHost,
} from "./taskMasterSession";
import { Home } from "./pages/Home";
import { LobbyRoom } from "./pages/LobbyRoom";
import { TaskMasterHost } from "./pages/TaskMasterHost";

type Screen =
  | { name: "home" }
  | { name: "lobby"; code: string; playerId: string }
  | { name: "taskmaster"; sessionId: string; hostToken: string };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [taskSession, setTaskSession] = useState<TaskMasterSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    const taskHost = loadTaskMasterHost();
    if (taskHost) {
      setScreen({
        name: "taskmaster",
        sessionId: taskHost.sessionId,
        hostToken: taskHost.hostToken,
      });
      return;
    }

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
    if (screen.name !== "taskmaster") return;

    const unsubscribe = subscribeTaskMaster(
      screen.sessionId,
      (next) => {
        setTaskSession(next);
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

  async function handleStartTaskMaster() {
    setBusy(true);
    setError(null);
    try {
      const created = await createTaskMasterSession();
      saveTaskMasterHost({
        sessionId: created.session.id,
        hostToken: created.hostToken,
      });
      clearSession();
      setLobby(null);
      setTaskSession(created.session);
      setScreen({
        name: "taskmaster",
        sessionId: created.session.id,
        hostToken: created.hostToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start TaskMaster.");
    } finally {
      setBusy(false);
    }
  }

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
      clearTaskMasterHost();
      setTaskSession(null);
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
      clearTaskMasterHost();
      setTaskSession(null);
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

  function handleLeaveLobby() {
    const current = screenRef.current;
    if (current.name === "lobby") {
      void leaveLobby(current.code, current.playerId);
    }
    clearSession();
    setLobby(null);
    setError(null);
    setScreen({ name: "home" });
  }

  function handleEndTaskMaster() {
    const current = screenRef.current;
    if (current.name === "taskmaster") {
      void endTaskMasterSession(current.sessionId, current.hostToken);
    }
    clearTaskMasterHost();
    setTaskSession(null);
    setError(null);
    setScreen({ name: "home" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <p className="brand">za3bolla</p>
      </header>

      <main className="stage">
        {screen.name === "home" ? (
          <Home
            busy={busy}
            error={error}
            onStartTaskMaster={handleStartTaskMaster}
            onCreateLobby={handleCreate}
            onJoinLobby={handleJoin}
          />
        ) : screen.name === "taskmaster" ? (
          <TaskMasterHost
            session={taskSession}
            sessionId={screen.sessionId}
            hostToken={screen.hostToken}
            busy={busy}
            error={error}
            onSession={setTaskSession}
            onError={setError}
            onBusy={setBusy}
            onEnd={handleEndTaskMaster}
          />
        ) : (
          <LobbyRoom
            lobby={lobby}
            playerId={screen.playerId}
            error={error}
            onLeave={handleLeaveLobby}
          />
        )}
      </main>
    </div>
  );
}
