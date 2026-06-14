export type Entry = {
  /** crypto.randomUUID() — stable client-generated id, safe to sync. */
  id: string;
  /** Positive integer calories. */
  kcal: number;
  description: string;
  /** Date.now() at creation; used for reverse-chronological ordering. */
  createdAt: number;
  /** 0 = not yet pushed to server, 1 = confirmed synced. Indexed for queue lookup. */
  synced: 0 | 1;
};
