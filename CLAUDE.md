# fat-track — notes for Claude

Offline-first calorie/habit logger. PWA, primary use is the iOS Home Screen,
fully offline. **IndexedDB is the local source of truth**; syncing is a manual,
best-effort push. See `README.md` for the full architecture.

## Verifying changes / avoiding regressions

There is a committed end-to-end suite that codifies the behaviors that matter.
**Run it after any change to the logging, storage, sync, or UI flow** rather
than re-deriving a test plan each time:

```bash
npm run test:e2e:install   # one-time: fetch the Chromium browser
npm run test:e2e           # builds, serves, and drives the real UI
```

The config (`playwright.config.ts`) builds the app and serves it with
`vite preview`, so tests run against the production bundle (service worker,
manifest, real output). Tests live in `tests/e2e/app.spec.ts`.

### What the suite locks down

- Empty state shows a zero total.
- Logging updates the running total and prepends to the list.
- List is **reverse-chronological** (newest first); total sums all entries.
- New entries are marked **unsynced**.
- Entries **persist across a page reload** (IndexedDB).
- **Sync with no server configured fails gracefully** — status message shown,
  rows stay queued and unsynced, nothing lost. This is the key offline-safety
  guarantee.
- Invalid kcal is rejected: empty (JS guard), non-integer like `12.5`
  (`step="1"` native validation), zero/negative (`min="1"` native validation).
- An entry with no description renders the `—` placeholder.

When you add a feature, add or extend a test here so the behavior is enforced
on the next change. Prefer driving the real UI (click/fill) over calling
internals.

## Gotchas worth remembering

- The kcal field is `<input type="number">` with `step="1" min="1"`. Bad values
  are often rejected by **native browser validation** before the submit handler
  runs (so the React guard only sees the empty-string case). Don't assume the
  JS guard is the only gate.
- The service worker only registers in a production build (`build`/`preview`),
  not in `dev`. Test PWA/offline behavior against the build.
- `VITE_SYNC_URL` is intentionally unset (server deferred). With it unset,
  `sync()` reports "No sync server configured yet" and keeps rows queued.
