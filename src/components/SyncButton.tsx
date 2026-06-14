import { useState } from 'react';
import { sync } from '../sync/sync';

type Props = {
  unsyncedCount: number;
  onSynced: () => void | Promise<void>;
};

export function SyncButton({ unsyncedCount, onSynced }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSync() {
    setBusy(true);
    setStatus(null);
    const result = await sync();
    if (result.ok) {
      setStatus(result.pushed > 0 ? `Synced ${result.pushed}` : 'Up to date');
      await onSynced();
    } else {
      setStatus(`Failed: ${result.reason}`);
    }
    setBusy(false);
  }

  return (
    <footer className="sync">
      <button className="btn btn--sync" onClick={handleSync} disabled={busy}>
        {busy ? 'Syncing…' : `Sync${unsyncedCount > 0 ? ` (${unsyncedCount})` : ''}`}
      </button>
      {status && <span className="sync__status">{status}</span>}
    </footer>
  );
}
