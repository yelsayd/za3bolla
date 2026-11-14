# za3bolla

Collaborative family web apps for [za3bolla.com](https://za3bolla.com). First game: **TaskMaster** — host-run scoring, no contestant devices required.

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
npm run build -w @za3bolla/shared
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

1. **TaskMaster (host):** start a session, add/rename/remove contestants, pick a task from the built-in family task bank (or type a free-text round title), record points per round, see the live leaderboard.
2. Shared lobby create/join (short code + SSE roster) remains available under “Open a shared lobby” for future device-based games. Lobby codes can be copied from the lobby room.

### TaskMaster task bank

`@za3bolla/shared` ships a curated bank of original, family-friendly TaskMaster-style briefs (living-room / kitchen / backyard props). On the host console, open **Task bank**, pick a task to fill the round title and show the brief to read aloud, then score as usual. Free-text round titles still work if you prefer your own tasks.

## Intentionally deferred

- Contestant phone join for TaskMaster
- Persistent storage / auth / Supabase

## Deploy on Railway (two services)

This monorepo deploys as **two Railway services** from the **same GitHub repo**. Keep **Root Directory empty** (repo root) so npm workspaces can install and build `@za3bolla/shared`. Do **not** point Root Directory at `apps/web` or `apps/server`.

Railway’s older `railway.toml` config-as-code is deprecated; settings are owned by each service (Dockerfile path / commands / env vars). The repo still includes `Dockerfile.server`, `Dockerfile.web`, and helper `railway.*.toml` files as documentation of the intended settings.

### Shared settings (both services)

| Setting | Value |
| --- | --- |
| Root Directory | *(empty / repo root)* |
| Builder | Dockerfile (set by providing a Dockerfile path) |

### API service (`@za3bolla/server`)

| Setting | Value |
| --- | --- |
| Dockerfile Path | `Dockerfile.server` |
| Healthcheck Path | `/api/health` |
| Custom build/start commands | *(leave empty — use Dockerfile)* |

**Variables**

| Name | Value |
| --- | --- |
| `CORS_ORIGIN` | Public web origin, e.g. `https://za3bollaweb-production.up.railway.app` (comma-separated if multiple). Optional; defaults to reflecting the request origin. |
| `PORT` | Set automatically by Railway |

### Web service (`@za3bolla/web`)

| Setting | Value |
| --- | --- |
| Dockerfile Path | `Dockerfile.web` |
| Custom build/start commands | *(leave empty — use Dockerfile)* |

**Variables** (must be set **before** a successful web build — Vite bakes them in)

| Name | Value |
| --- | --- |
| `VITE_API_URL` | Public API HTTPS URL, e.g. `https://za3bollaserver-production.up.railway.app` (no trailing slash) |
| `PORT` | Set automatically by Railway |

### Current production URLs

| Service | URL |
| --- | --- |
| API | https://za3bollaserver-production.up.railway.app |
| Web | https://za3bollaweb-production.up.railway.app |

### Verify

```bash
curl -s https://za3bollaserver-production.up.railway.app/api/health
# expect: {"ok":true,"service":"za3bolla"}
```

Open the web URL → start a TaskMaster session → add a contestant → confirm the leaderboard updates (SSE).
