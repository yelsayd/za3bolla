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

1. **TaskMaster (host):** start a session, add/rename/remove contestants, record points per round, see the live leaderboard.
2. Shared lobby create/join (short code + SSE roster) remains available under “Open a shared lobby” for future device-based games. Lobby codes can be copied from the lobby room.

## Intentionally deferred

- Contestant phone join for TaskMaster
- Task content library (free-text / “Round N” titles only)
- Persistent storage / auth / Supabase

## Deploy on Railway (two services)

This monorepo deploys as **two Railway services** from the **same GitHub repo**. Do **not** set Root Directory to `apps/web` or `apps/server` — npm workspaces need the repo root so `@za3bolla/shared` installs and builds correctly.

### Shared settings (both services)

| Setting | Value |
| --- | --- |
| Root Directory | *(empty / repo root)* |
| Builder | Dockerfile |

### API service (`@za3bolla/server`)

| Setting | Value |
| --- | --- |
| Config File | `railway.server.toml` |
| Dockerfile Path | `Dockerfile.server` (set by config file) |

**Variables**

| Name | Value |
| --- | --- |
| `CORS_ORIGIN` | Public web origin, e.g. `https://web-xxx.up.railway.app` (comma-separated if multiple). Optional; defaults to reflecting the request origin. |
| `PORT` | Set automatically by Railway |

Generate a public domain for this service, then note the HTTPS URL (no trailing slash).

### Web service (`@za3bolla/web`)

| Setting | Value |
| --- | --- |
| Config File | `railway.web.toml` |
| Dockerfile Path | `Dockerfile.web` (set by config file) |

**Variables** (must be set **before** a successful web build — Vite bakes them in)

| Name | Value |
| --- | --- |
| `VITE_API_URL` | Public API HTTPS URL, e.g. `https://server-xxx.up.railway.app` (no trailing slash) |
| `PORT` | Set automatically by Railway |

Generate a public domain for the web service.

### Dashboard clicks still needed

1. Clear Root Directory on both services if Railway set it to `apps/...`.
2. Point each service at its config file (`railway.server.toml` / `railway.web.toml`) **or** set Dockerfile path manually.
3. Generate domains for API + web.
4. Set `VITE_API_URL` on web to the API public URL, then **redeploy web**.
5. Optionally set `CORS_ORIGIN` on the API to the web public URL.

### Verify

```bash
curl -s https://<api-domain>/api/health
# expect: {"ok":true,"service":"za3bolla"}
```

Open the web domain → start a TaskMaster session → add a contestant → confirm the leaderboard updates (SSE).
