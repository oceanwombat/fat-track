import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Entry } from '../types';

interface FatTrackDB extends DBSchema {
  entries: {
    key: string;
    value: Entry;
    indexes: {
      createdAt: number;
      synced: number;
    };
  };
}

const DB_NAME = 'fat-track';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FatTrackDB>> | null = null;

/** Open the database once and reuse the connection across all calls. */
function getDB(): Promise<IDBPDatabase<FatTrackDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FatTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('synced', 'synced');
      },
    });
  }
  return dbPromise;
}

/** Create and persist a new entry. Kcal is assumed pre-validated as a positive integer. */
export async function addEntry(kcal: number, description: string): Promise<Entry> {
  const entry: Entry = {
    id: crypto.randomUUID(),
    kcal,
    description: description.trim(),
    createdAt: Date.now(),
    synced: 0,
  };
  const db = await getDB();
  await db.put('entries', entry);
  return entry;
}

/** All entries, newest first. */
export async function getAllEntries(): Promise<Entry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('entries', 'createdAt');
  return all.reverse();
}

/** Entries not yet confirmed as synced to the server. */
export async function getUnsynced(): Promise<Entry[]> {
  const db = await getDB();
  return db.getAllFromIndex('entries', 'synced', 0);
}

/** Flip the given entries to synced. Called only after a confirmed server 2xx. */
export async function markSynced(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readwrite');
  await Promise.all(
    ids.map(async (id) => {
      const entry = await tx.store.get(id);
      if (entry) {
        entry.synced = 1;
        await tx.store.put(entry);
      }
    }),
  );
  await tx.done;
}
