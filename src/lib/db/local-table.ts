import { safeStorage } from '@/lib/storage';

/**
 * LIFE's entire persistence layer.
 *
 * The app used to be a thin client over Supabase Postgres — every hook in
 * `src/hooks/` issued `.select()`/`.insert()`/`.update()` against a real
 * server. It is now local-first: every one of those tables is a JSON array
 * under one AsyncStorage key, and this file is the only thing that touches
 * storage directly. Hooks call `table<Row>('goals')` and get the same
 * select/insert/update/delete shape Supabase gave them, so the domain logic
 * built on top — streaks, cycles, funnel math — didn't have to change, only
 * what it talks to.
 *
 * Three properties this format exists to guarantee:
 *
 * 1. One malformed row can never take down a table. `safeParseRows` drops
 *    only the entries that fail validation and keeps the rest — a corrupted
 *    goal must never make every goal disappear, and it must never throw
 *    during render, which is what "the whole app goes black on save" turns
 *    out to mean in practice: a write produces a shape a screen wasn't ready
 *    to read, and the read throws with no boundary above it to catch it.
 * 2. A read is synchronous once warm. Every table is loaded into an
 *    in-memory cache on first use and every write updates that cache
 *    immediately, before the AsyncStorage write even settles — so a screen
 *    reading a table it just wrote to sees the write, rather than racing the
 *    async persist.
 * 3. Every row gets `id`, `created_at`, `updated_at` here, once, rather than
 *    in each of the twenty-two places a row used to get inserted.
 */

const STORAGE_PREFIX = 'life-db-';
const SCHEMA_VERSION = 1;
const VERSION_KEY = 'life-db-schema-version';

/**
 * Only `id` is required. A few rows carried over from the Supabase schema
 * never had a `created_at` — `TaskCompletionRow` calls its own timestamp
 * `completed_at`, and a couple of one-row settings tables only ever had
 * `updated_at`. `insert`/`update` still stamp both fields on every row
 * underneath, structurally compatible whether or not the Row type declares
 * them — this only widens what's *required*, not what actually gets written.
 */
type BaseRow = { id: string };

/** Cache of already-loaded tables, keyed by table name — the synchronous part. */
const cache = new Map<string, unknown[]>();
/** In-flight loads, so concurrent first-reads of the same table share one fetch. */
const loading = new Map<string, Promise<unknown[]>>();
/** Listeners per table, so every hook reading a table re-renders on any write to it. */
const listeners = new Map<string, Set<() => void>>();

function genId(): string {
  // Not cryptographic — these are local record identifiers, not secrets.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function notify(name: string) {
  listeners.get(name)?.forEach((fn) => fn());
}

export function subscribeTable(name: string, fn: () => void): () => void {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(fn);
  return () => listeners.get(name)?.delete(fn);
}

/**
 * Parses a table's stored JSON into rows, dropping anything that isn't a
 * plausible row instead of throwing. `JSON.parse` failing entirely (the
 * whole value is corrupt, not just one entry) recovers to an empty table
 * rather than taking the read down — an empty table is a visible, honest
 * "nothing here yet"; a thrown error with nothing above it to catch is a
 * black screen.
 */
function safeParseRows<Row extends BaseRow>(raw: string | null): Row[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (r): r is Row =>
      !!r && typeof r === 'object' && typeof (r as Record<string, unknown>).id === 'string'
  );
}

async function loadTable<Row extends BaseRow>(name: string): Promise<Row[]> {
  if (cache.has(name)) return cache.get(name) as Row[];
  if (loading.has(name)) return loading.get(name) as Promise<Row[]>;

  const promise = safeStorage
    .getItem(STORAGE_PREFIX + name)
    .then((raw) => safeParseRows<Row>(raw))
    .catch(() => [] as Row[])
    .then((rows) => {
      cache.set(name, rows);
      loading.delete(name);
      return rows;
    });
  loading.set(name, promise);
  return promise;
}

function persist(name: string, rows: unknown[]) {
  cache.set(name, rows);
  notify(name);
  // Fire-and-forget: the cache is already the source of truth for every
  // synchronous reader, so a slow or failed disk write degrades to
  // "survives until the tab closes" rather than "the edit didn't happen."
  safeStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(rows)).catch(() => {});
}

/**
 * A typed handle on one local table. `ensureLoaded` primes the cache;
 * `snapshot` reads it synchronously (empty array before the first load
 * resolves — callers pair this with a React Query `queryFn` that awaits
 * `ensureLoaded` first, so the empty read is never what actually renders).
 */
export function table<Row extends BaseRow>(name: string) {
  return {
    name,
    async ensureLoaded(): Promise<Row[]> {
      return loadTable<Row>(name);
    },
    snapshot(): Row[] {
      return (cache.get(name) as Row[] | undefined) ?? [];
    },
    async select(predicate?: (row: Row) => boolean): Promise<Row[]> {
      const rows = await loadTable<Row>(name);
      return predicate ? rows.filter(predicate) : rows.slice();
    },
    async insert(
      row: Omit<Row, 'id' | 'created_at' | 'updated_at'> & {
        id?: string;
        created_at?: string;
        updated_at?: string;
      }
    ): Promise<Row> {
      const rows = await loadTable<Row>(name);
      const now = new Date().toISOString();
      const full = {
        ...row,
        id: row.id ?? genId(),
        created_at: row.created_at ?? now,
        updated_at: now,
      } as unknown as Row;
      persist(name, [...rows, full]);
      return full;
    },
    async update(id: string, patch: Partial<Row>): Promise<Row | null> {
      const rows = await loadTable<Row>(name);
      let updated: Row | null = null;
      const next = rows.map((r) => {
        if (r.id !== id) return r;
        updated = { ...r, ...patch, id: r.id, updated_at: new Date().toISOString() };
        return updated;
      });
      if (updated) persist(name, next);
      return updated;
    },
    /** Insert-or-update by a caller-supplied match, for "one row per slot" tables. */
    async upsert(match: (row: Row) => boolean, row: Omit<Row, 'id' | 'created_at' | 'updated_at'>): Promise<Row> {
      const rows = await loadTable<Row>(name);
      const existing = rows.find(match);
      if (existing) {
        const result = await this.update(existing.id, row as Partial<Row>);
        return result!;
      }
      return this.insert(row);
    },
    async updateWhere(predicate: (row: Row) => boolean, patch: Partial<Row>): Promise<void> {
      const rows = await loadTable<Row>(name);
      const now = new Date().toISOString();
      persist(
        name,
        rows.map((r) => (predicate(r) ? { ...r, ...patch, id: r.id, updated_at: now } : r))
      );
    },
    async delete(id: string): Promise<void> {
      const rows = await loadTable<Row>(name);
      persist(name, rows.filter((r) => r.id !== id));
    },
    async deleteWhere(predicate: (row: Row) => boolean): Promise<void> {
      const rows = await loadTable<Row>(name);
      persist(name, rows.filter((r) => !predicate(r)));
    },
    async clear(): Promise<void> {
      persist(name, []);
    },
  };
}

/**
 * Schema versioning + migration hook. There is exactly one version so far —
 * this exists so the *next* local-schema change has a place to land instead
 * of silently reinterpreting old rows under a new shape. A future migration
 * reads `getSchemaVersion()`, transforms whatever tables changed, then calls
 * `setSchemaVersion(SCHEMA_VERSION)`.
 */
export async function getSchemaVersion(): Promise<number> {
  const raw = await safeStorage.getItem(VERSION_KEY);
  const n = raw ? parseInt(raw, 10) : SCHEMA_VERSION;
  return Number.isFinite(n) ? n : SCHEMA_VERSION;
}

export async function ensureSchemaCurrent(): Promise<void> {
  const version = await getSchemaVersion();
  if (version >= SCHEMA_VERSION) return;
  // No migrations exist yet — this just stamps a fresh install to current.
  await safeStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
}

/**
 * Every table LIFE writes to. Kept in one place because export and reset are
 * the two operations that have to touch all of them — everywhere else, a
 * hook only knows about its own domain's tables, on purpose.
 */
export const ALL_TABLE_NAMES = [
  'profiles',
  'notification_preferences',
  'day_templates',
  'template_tasks',
  'task_completions',
  'goals',
  'prayer_logs',
  'qada_makeups',
  'retention_events',
  'sleep_logs',
  'daily_scores',
  'workout_cycle_settings',
  'exercise_catalog',
  'workout_sessions',
  'workout_exercise_entries',
  'workout_sets',
  'work_sessions',
  'work_breaks',
  'work_events',
  'work_targets',
  'weekly_reviews',
  'weekly_review_goal_checkins',
  'quarterly_reviews',
] as const;

/**
 * A full local backup, one JSON object keyed by table name. This is the
 * actual replacement for what account-linking used to protect against: with
 * no server, there is no copy of this data anywhere else, so a file the user
 * can save themselves is the only durability story left. Schema version
 * travels with it so a restore (not built yet, but this is the shape it
 * would read) knows what it's looking at.
 */
export async function exportAllData(): Promise<string> {
  const dump: Record<string, unknown[]> = {};
  for (const name of ALL_TABLE_NAMES) {
    dump[name] = await loadTable(name);
  }
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), schemaVersion: await getSchemaVersion(), tables: dump },
    null,
    2
  );
}

/**
 * Erases every local table. Irreversible, and deliberately not wired to
 * anything automatic — the one call site is a settings action gated behind
 * its own explicit confirm dialog, typed out in full each time by whoever
 * calls it, never triggered as a side effect of an error path or a bad
 * migration.
 */
export async function clearAllData(): Promise<void> {
  for (const name of ALL_TABLE_NAMES) {
    await table(name).clear();
  }
}
