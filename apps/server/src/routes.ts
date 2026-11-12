import { Router, type Request, type Response } from "express";
import {
  isValidJoinCode,
  validateDisplayName,
  type CreateLobbyRequest,
  type JoinLobbyRequest,
} from "@za3bool/shared";
import { LobbyError, lobbyStore } from "./lobbyStore.js";

export const lobbyRouter = Router();

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

lobbyRouter.post("/", (req: Request, res: Response) => {
  try {
    const body = req.body as CreateLobbyRequest;
    const nameError = validateDisplayName(body?.displayName ?? "");
    if (nameError) {
      res.status(400).json({ error: nameError });
      return;
    }

    const session = lobbyStore.create(body.displayName);
    res.status(201).json(session);
  } catch (error) {
    sendError(res, error);
  }
});

lobbyRouter.post("/:code/join", (req: Request, res: Response) => {
  try {
    const code = paramValue(req.params.code);
    if (!isValidJoinCode(code)) {
      res.status(400).json({ error: "Join code must be 4 characters." });
      return;
    }

    const body = req.body as JoinLobbyRequest;
    const nameError = validateDisplayName(body?.displayName ?? "");
    if (nameError) {
      res.status(400).json({ error: nameError });
      return;
    }

    const session = lobbyStore.join(code, body.displayName);
    res.status(200).json(session);
  } catch (error) {
    sendError(res, error);
  }
});

lobbyRouter.get("/:code", (req: Request, res: Response) => {
  try {
    const code = paramValue(req.params.code);
    if (!isValidJoinCode(code)) {
      res.status(400).json({ error: "Join code must be 4 characters." });
      return;
    }

    res.json({ lobby: lobbyStore.get(code) });
  } catch (error) {
    sendError(res, error);
  }
});

lobbyRouter.get("/:code/events", (req: Request, res: Response) => {
  try {
    const code = paramValue(req.params.code);
    if (!isValidJoinCode(code)) {
      res.status(400).json({ error: "Join code must be 4 characters." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const unsubscribe = lobbyStore.subscribe(code, (lobby) => {
      res.write(`data: ${JSON.stringify({ type: "lobby", lobby })}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (error) {
    sendError(res, error);
  }
});

function sendError(res: Response, error: unknown): void {
  if (error instanceof LobbyError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
}
