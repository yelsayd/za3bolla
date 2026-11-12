import cors from "cors";
import express from "express";
import { lobbyRouter } from "./routes.js";

const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "za3bool.land" });
});

app.use("/api/lobbies", lobbyRouter);

app.listen(PORT, () => {
  console.log(`za3bool.land server listening on http://localhost:${PORT}`);
});
