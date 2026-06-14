import type { Entry } from '../types';

type Props = {
  entries: Entry[];
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EntryList({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="empty">No entries yet. Tap Log to add one.</p>;
  }

  return (
    <ul className="entry-list">
      {entries.map((entry) => (
        <li key={entry.id} className="entry">
          <span className="entry__kcal">{entry.kcal}</span>
          <span className="entry__body">
            <span className="entry__desc">{entry.description || '—'}</span>
            <span className="entry__time">{formatTime(entry.createdAt)}</span>
          </span>
          <span
            className={`entry__dot${entry.synced ? ' entry__dot--synced' : ''}`}
            title={entry.synced ? 'Synced' : 'Not synced'}
          />
        </li>
      ))}
    </ul>
  );
}
