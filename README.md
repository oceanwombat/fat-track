# fat-track

A minimal, **offline-first** calorie/habit logger built as an installable PWA.
Primary use case: add to the iOS Home Screen and log fully offline. All data is
stored locally in IndexedDB; syncing to a server is a manual, best-effort push.

## Stack

- **Vite + React + TypeScript**
- **IndexedDB** (via [`idb`](https://github.com/jakearchibald/idb)) as the local
  source of truth
- **vite-plugin-pwa** (Workbox) for the service worker, offline app-shell
  precache, and web app manifest

## How it works

- Logging writes to IndexedDB first and the UI renders from it — the network is
  never on the critical path.
- Each entry is `{ id, kcal, description, createdAt, synced }`.
- The **Sync** button pushes all `synced: 0` rows as one batch to
  `VITE_SYNC_URL` and only marks them synced on a confirmed 2xx. Offline or with
  no endpoint configured, it fails gracefully and keeps rows queued — no data
  loss.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Configure sync (optional, deferred)

The sync server is intentionally not built yet. When one exists, set:

```bash
# .env
VITE_SYNC_URL=https://your-server.example.com/api/sync
```

The endpoint receives `POST { "entries": Entry[] }` and should respond `2xx` on
success. No auth yet — add it before exposing the endpoint publicly.

## Add to iOS Home Screen

Open the deployed URL in Safari → Share → **Add to Home Screen**. Launching from
the icon runs standalone and works offline.
