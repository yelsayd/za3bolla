# za3bolla

Collaborative family web apps (repo may still appear as za3bool.land). First game: **TaskMaster** — host-run scoring, no contestant devices required.

## Layout

```
apps/
  server/     Node + Express API, SSE lobbies, TaskMaster sessions
  web/        React (Vite) client
packages/
  shared/     Lobby + TaskMaster types and helpers
```

## Prerequisites

- Node.js 20+

## Run locally

From the repo root:

```bash
npm install
npm run build -w @za3bool/shared
```

Start the API (terminal 1):

```bash
npm run dev:server
```

Start the web app (terminal 2):

```bash
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to the backend on port `8787`.

### Quick API check

```bash
curl -s http://localhost:8787/api/health
curl -s -X POST http://localhost:8787/api/taskmaster
```

## What works now

1. **TaskMaster (host):** start a session, add/rename/remove contestants, record points per round, see the live leaderboard.
2. Shared lobby create/join (short code + SSE roster) remains available under “Open a shared lobby” for future device-based games.

## Intentionally deferred

- Contestant phone join for TaskMaster
- Task content library (free-text / “Round N” titles only)
- Persistent storage / auth / Supabase
- Full package rename away from `@za3bool/*`
