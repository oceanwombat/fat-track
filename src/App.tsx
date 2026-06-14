import { useEffect, useMemo, useState } from 'react';
import type { Entry } from './types';
import { addEntry, getAllEntries } from './db/db';
import { Summary } from './components/Summary';
import { LogForm } from './components/LogForm';
import { EntryList } from './components/EntryList';
import { SyncButton } from './components/SyncButton';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);

  async function refresh() {
    setEntries(await getAllEntries());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave(kcal: number, description: string) {
    await addEntry(kcal, description);
    await refresh();
  }

  const total = useMemo(() => entries.reduce((sum, e) => sum + e.kcal, 0), [entries]);
  const unsyncedCount = useMemo(() => entries.filter((e) => e.synced === 0).length, [entries]);

  return (
    <div className="app">
      <Summary total={total} />
      <main className="content">
        <LogForm onSave={handleSave} />
        <EntryList entries={entries} />
      </main>
      <SyncButton unsyncedCount={unsyncedCount} onSynced={refresh} />
    </div>
  );
}
