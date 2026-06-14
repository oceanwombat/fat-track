import { getUnsynced, markSynced } from '../db/db';

export type SyncResult =
  | { ok: true; pushed: number }
  | { ok: false; pushed: 0; reason: string };

/** Configurable sync endpoint. Unset for now — the server is deferred. */
const SYNC_URL = import.meta.env.VITE_SYNC_URL as string | undefined;

/**
 * Best-effort push of all unsynced entries to the server as a single batch.
 *
 * Local data is authoritative: entries are only flipped to synced on a
 * confirmed 2xx. Any failure (offline, no endpoint configured, server error)
 * leaves rows queued so nothing is lost.
 */
export async function sync(): Promise<SyncResult> {
  const pending = await getUnsynced();
  if (pending.length === 0) {
    return { ok: true, pushed: 0 };
  }

  if (!SYNC_URL) {
    return { ok: false, pushed: 0, reason: 'No sync server configured yet' };
  }

  try {
    const res = await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: pending }),
    });

    if (!res.ok) {
      return { ok: false, pushed: 0, reason: `Server responded ${res.status}` };
    }

    await markSynced(pending.map((e) => e.id));
    return { ok: true, pushed: pending.length };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Network error';
    return { ok: false, pushed: 0, reason };
  }
}
