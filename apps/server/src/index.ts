import cors from "cors";
import express from "express";
import { lobbyRouter } from "./routes.js";
import { taskMasterRouter } from "./taskMasterRoutes.js";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";

const corsOrigin = process.env.CORS_ORIGIN?.trim();
const corsOrigins = corsOrigin
  ? corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean)
  : true;

const app = express();
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "za3bolla" });
});

app.use("/api/lobbies", lobbyRouter);
app.use("/api/taskmaster", taskMasterRouter);

app.listen(PORT, HOST, () => {
  console.log(`za3bolla server listening on http://${HOST}:${PORT}`);
});
