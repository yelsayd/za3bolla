import { Router, type Request, type Response } from "express";
import {
  validateContestantName,
  validateRoundTitle,
  type AddContestantRequest,
  type RecordRoundRequest,
  type RenameContestantRequest,
} from "@za3bolla/shared";
import { TaskMasterError, taskMasterStore } from "./taskMasterStore.js";

export const taskMasterRouter = Router();

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readHostToken(req: Request): string {
  const header = req.header("x-host-token");
  if (header?.trim()) return header.trim();
  const bodyToken =
    typeof req.body?.hostToken === "string" ? req.body.hostToken.trim() : "";
  return bodyToken;
}

function requireHostToken(req: Request, res: Response): string | null {
  const token = readHostToken(req);
  if (!token) {
    res.status(401).json({ error: "Host token is required." });
    return null;
  }
  return token;
}

taskMasterRouter.post("/", (_req: Request, res: Response) => {
  try {
    const created = taskMasterStore.create();
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

taskMasterRouter.get("/:sessionId", (req: Request, res: Response) => {
  try {
    const sessionId = paramValue(req.params.sessionId);
    res.json({ session: taskMasterStore.get(sessionId) });
  } catch (error) {
    sendError(res, error);
  }
});

taskMasterRouter.get("/:sessionId/events", (req: Request, res: Response) => {
  try {
    const sessionId = paramValue(req.params.sessionId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const unsubscribe = taskMasterStore.subscribe(sessionId, (session) => {
      res.write(`data: ${JSON.stringify({ type: "session", session })}\n\n`);
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

taskMasterRouter.post("/:sessionId/contestants", (req: Request, res: Response) => {
  try {
    const hostToken = requireHostToken(req, res);
    if (!hostToken) return;

    const body = req.body as AddContestantRequest;
    const nameError = validateContestantName(body?.name ?? "");
    if (nameError) {
      res.status(400).json({ error: nameError });
      return;
    }

    const session = taskMasterStore.addContestant(
      paramValue(req.params.sessionId),
      hostToken,
      body.name,
    );
    res.status(201).json({ session });
  } catch (error) {
    sendError(res, error);
  }
});

taskMasterRouter.patch(
  "/:sessionId/contestants/:contestantId",
  (req: Request, res: Response) => {
    try {
      const hostToken = requireHostToken(req, res);
      if (!hostToken) return;

      const body = req.body as RenameContestantRequest;
      const nameError = validateContestantName(body?.name ?? "");
      if (nameError) {
        res.status(400).json({ error: nameError });
        return;
      }

      const session = taskMasterStore.renameContestant(
        paramValue(req.params.sessionId),
        hostToken,
        paramValue(req.params.contestantId),
        body.name,
      );
      res.json({ session });
    } catch (error) {
      sendError(res, error);
    }
  },
);

taskMasterRouter.delete(
  "/:sessionId/contestants/:contestantId",
  (req: Request, res: Response) => {
    try {
      const hostToken = requireHostToken(req, res);
      if (!hostToken) return;

      const session = taskMasterStore.removeContestant(
        paramValue(req.params.sessionId),
        hostToken,
        paramValue(req.params.contestantId),
      );
      res.json({ session });
    } catch (error) {
      sendError(res, error);
    }
  },
);

taskMasterRouter.post("/:sessionId/rounds", (req: Request, res: Response) => {
  try {
    const hostToken = requireHostToken(req, res);
    if (!hostToken) return;

    const body = req.body as RecordRoundRequest;
    if (!Array.isArray(body?.scores)) {
      res.status(400).json({ error: "scores must be an array." });
      return;
    }

    if (body.title != null && body.title !== "") {
      const titleError = validateRoundTitle(body.title);
      if (titleError) {
        res.status(400).json({ error: titleError });
        return;
      }
    }

    const session = taskMasterStore.recordRound(
      paramValue(req.params.sessionId),
      hostToken,
      body.title,
      body.scores,
    );
    res.status(201).json({ session });
  } catch (error) {
    sendError(res, error);
  }
});

taskMasterRouter.delete("/:sessionId", (req: Request, res: Response) => {
  try {
    const hostToken = requireHostToken(req, res);
    if (!hostToken) return;

    taskMasterStore.end(paramValue(req.params.sessionId), hostToken);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
});

function sendError(res: Response, error: unknown): void {
  if (error instanceof TaskMasterError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
}
