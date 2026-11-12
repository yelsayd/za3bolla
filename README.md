# za3bool.land

Collaborative family web apps platform. v1 is **create + join lobby** only (no gameplay yet).

## Layout

```
apps/
  server/     Node + Express API and SSE lobby updates
  web/        React (Vite) client
packages/
  shared/     Reusable lobby/session types and helpers
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
curl -s -X POST http://localhost:8787/api/lobbies \
  -H 'content-type: application/json' \
  -d '{"displayName":"Host"}'
```

## What works in v1

1. Create a lobby and receive a 4-character join code.
2. Join that lobby with the code and a display name.
3. See the player list update live (Server-Sent Events) as people join.
4. Shared lobby concepts live in `@za3bool/shared` for future games.

## Intentionally deferred

- TaskMaster tasks, scoring, and moderation
- Persistent storage / auth
- TV/host second-screen mode
- Closing or starting a game from the lobby
