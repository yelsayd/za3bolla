import cors from "cors";
import express from "express";
import { lobbyRouter } from "./routes.js";
import { taskMasterRouter } from "./taskMasterRoutes.js";

const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "za3bolla" });
});

app.use("/api/lobbies", lobbyRouter);
app.use("/api/taskmaster", taskMasterRouter);

app.listen(PORT, () => {
  console.log(`za3bolla server listening on http://localhost:${PORT}`);
});
