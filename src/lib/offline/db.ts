/**
 * Minimal IndexedDB wrapper for PassAI's offline stores.
 *
 * Hand-rolled rather than pulling in `idb`: this is two stores and a handful of
 * operations, and every call site already has to tolerate IndexedDB being
 * unavailable (private browsing, storage pressure), so the error handling would
 * look the same either way.
 *
 * Every helper swallows storage failures and reports "nothing cached". Offline
 * support is an enhancement; it must never break the online path.
 */

const DB_NAME = "passai-offline";
const DB_VERSION = 1;

/** Topic-quiz sessions, keyed by `${courseId}:${topicId}`. */
export const STORE_QUIZ_SESSION = "quiz-session";
/** Miscellaneous cached reads, keyed by caller-chosen string. */
export const STORE_KV = "kv";

const STORES = [STORE_QUIZ_SESSION, STORE_KV];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
    }).catch((err) => {
      // Let the next caller retry rather than caching the rejection forever.
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = fn(tx.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export async function idbGet<T>(store: string, key: string): Promise<T | null> {
  try {
    const value = await run<T | undefined>(store, "readonly", (s) => s.get(key));
    return value ?? null;
  } catch {
    return null;
  }
}

export async function idbSet(store: string, key: string, value: unknown): Promise<boolean> {
  try {
    await run(store, "readwrite", (s) => s.put(value, key));
    return true;
  } catch {
    return false;
  }
}

export async function idbDelete(store: string, key: string): Promise<void> {
  try {
    await run(store, "readwrite", (s) => s.delete(key));
  } catch {
    /* unreachable either way */
  }
}

async function idbClear(store: string): Promise<void> {
  try {
    await run(store, "readwrite", (s) => s.clear());
  } catch {
    /* ignore */
  }
}

/** Wipe every offline store. Called on sign-out so nothing leaks between users. */
export async function clearOfflineData(): Promise<void> {
  await Promise.all(STORES.map(idbClear));
}
