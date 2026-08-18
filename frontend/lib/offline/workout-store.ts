"use client";

const DATABASE_NAME = "lift-log-offline";
const DATABASE_VERSION = 1;
const RESPONSE_STORE = "responses";
const MUTATION_STORE = "mutations";
const ACTIVE_USER_KEY = "lift-log:offline-user";

export const OFFLINE_STATE_EVENT = "lift-log:offline-state";
export const OFFLINE_SYNC_EVENT = "lift-log:offline-sync";

interface CachedResponse<T = unknown> {
  key: string;
  userId: string;
  url: string;
  data: T;
  updatedAt: number;
}

interface SetMutationBody {
  workout_date: string;
  exercise_name: string;
  sets: Array<{
    weight: number;
    reps: number;
    note: string | null;
    client_mutation_id: string;
  }>;
}

interface PendingSetMutation {
  id: string;
  userId: string;
  url: string;
  body: SetMutationBody;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

interface ExerciseBlockLike {
  exercise?: { name?: string };
  sets?: Array<Record<string, unknown>>;
}

export interface OfflineSubmitResult {
  status: "synced" | "queued";
  clientMutationId: string;
  data?: unknown;
}

export interface OfflineSyncResult {
  synced: number;
  failed: number;
  pending: number;
}

export class OfflineHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
    message: string
  ) {
    super(message);
    this.name = "OfflineHttpError";
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RESPONSE_STORE)) {
        const responseStore = database.createObjectStore(RESPONSE_STORE, {
          keyPath: "key",
        });
        responseStore.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains(MUTATION_STORE)) {
        const mutationStore = database.createObjectStore(MUTATION_STORE, {
          keyPath: "id",
        });
        mutationStore.createIndex("userId", "userId", { unique: false });
        mutationStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function makeResponseKey(userId: string, url: string): string {
  return `${userId}::${new URL(url, window.location.origin).toString()}`;
}

function notifyStateChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_STATE_EVENT));
  }
}

function createClientMutationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function temporarySetId(clientMutationId: string): number {
  let hash = 0;
  for (let index = 0; index < clientMutationId.length; index += 1) {
    hash = (hash * 31 + clientMutationId.charCodeAt(index)) | 0;
  }
  return -Math.max(1, Math.abs(hash));
}

export function setActiveOfflineUser(userId: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACTIVE_USER_KEY, userId);
    notifyStateChanged();
  }
}

export function getActiveOfflineUser(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACTIVE_USER_KEY);
}

async function putCachedResponse<T>(
  userId: string,
  url: string,
  data: T
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(RESPONSE_STORE, "readwrite");
  transaction.objectStore(RESPONSE_STORE).put({
    key: makeResponseKey(userId, url),
    userId,
    url: new URL(url, window.location.origin).toString(),
    data,
    updatedAt: Date.now(),
  } satisfies CachedResponse<T>);
  await transactionDone(transaction);
  database.close();
}

async function readCachedResponse<T>(
  userId: string,
  url: string
): Promise<{ found: boolean; data: T | null }> {
  const database = await openDatabase();
  const transaction = database.transaction(RESPONSE_STORE, "readonly");
  const result = (await requestToPromise(
    transaction.objectStore(RESPONSE_STORE).get(makeResponseKey(userId, url))
  )) as CachedResponse<T> | undefined;
  await transactionDone(transaction);
  database.close();
  return result
    ? { found: true, data: result.data }
    : { found: false, data: null };
}

async function responseError(response: Response): Promise<OfflineHttpError> {
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const message =
    data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : `HTTP error! Status: ${response.status}`;
  return new OfflineHttpError(response.status, data, message);
}

export async function fetchJsonWithOfflineCache<T>(
  url: string,
  options: { allowNotFound?: boolean } = {}
): Promise<T | null> {
  const userId = getActiveOfflineUser();

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 404 && options.allowNotFound) {
      if (userId) {
        await putCachedResponse(userId, url, null);
      }
      return null;
    }

    if (!response.ok) {
      throw await responseError(response);
    }

    const data = (await response.json()) as T;
    if (userId) {
      await putCachedResponse(userId, url, data);
    }
    return data;
  } catch (error) {
    if (error instanceof OfflineHttpError || !userId) {
      throw error;
    }

    const cached = await readCachedResponse<T>(userId, url);
    if (cached.found) {
      return cached.data;
    }
    throw error;
  }
}

async function putPendingMutation(mutation: PendingSetMutation): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readwrite");
  transaction.objectStore(MUTATION_STORE).put(mutation);
  await transactionDone(transaction);
  database.close();
}

async function deletePendingMutation(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readwrite");
  transaction.objectStore(MUTATION_STORE).delete(id);
  await transactionDone(transaction);
  database.close();
}

async function updatePendingMutation(
  mutation: PendingSetMutation,
  error: unknown
): Promise<void> {
  await putPendingMutation({
    ...mutation,
    attempts: mutation.attempts + 1,
    lastError: error instanceof Error ? error.message : String(error),
  });
}

async function getPendingMutations(userId: string): Promise<PendingSetMutation[]> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readonly");
  const index = transaction.objectStore(MUTATION_STORE).index("userId");
  const mutations = (await requestToPromise(
    index.getAll(userId)
  )) as PendingSetMutation[];
  await transactionDone(transaction);
  database.close();
  return mutations.sort((left, right) => left.createdAt - right.createdAt);
}

export async function getPendingMutationCount(): Promise<number> {
  const userId = getActiveOfflineUser();
  if (!userId) {
    return 0;
  }
  return (await getPendingMutations(userId)).length;
}

async function applyOptimisticSet(mutation: PendingSetMutation): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(RESPONSE_STORE, "readwrite");
  const store = transaction.objectStore(RESPONSE_STORE);
  const responses = (await requestToPromise(
    store.index("userId").getAll(mutation.userId)
  )) as CachedResponse[];

  for (const response of responses) {
    const responseUrl = new URL(response.url);
    if (
      responseUrl.pathname !== "/api/exercise-block" ||
      responseUrl.searchParams.get("workout_date") !== mutation.body.workout_date ||
      !Array.isArray(response.data)
    ) {
      continue;
    }

    let changed = false;
    const nextData = (response.data as ExerciseBlockLike[]).map((block) => {
      if (block.exercise?.name !== mutation.body.exercise_name) {
        return block;
      }

      const currentSets = Array.isArray(block.sets) ? block.sets : [];
      if (
        currentSets.some(
          (set) => set.clientMutationId === mutation.id
        )
      ) {
        return block;
      }

      const setNumber =
        currentSets.reduce(
          (maximum, set) =>
            Math.max(maximum, Number(set.setNumber || 0)),
          0
        ) + 1;
      const set = mutation.body.sets[0];
      changed = true;
      return {
        ...block,
        sets: [
          ...currentSets,
          {
            id: temporarySetId(mutation.id),
            setNumber,
            weight: set.weight,
            reps: set.reps,
            note: set.note,
            clientMutationId: mutation.id,
            pending: true,
          },
        ],
      };
    });

    if (changed) {
      store.put({
        ...response,
        data: nextData,
        updatedAt: Date.now(),
      } satisfies CachedResponse);
    }
  }

  await transactionDone(transaction);
  database.close();
}

async function refreshExerciseBlockCaches(
  mutation: PendingSetMutation
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(RESPONSE_STORE, "readonly");
  const responses = (await requestToPromise(
    transaction.objectStore(RESPONSE_STORE).index("userId").getAll(mutation.userId)
  )) as CachedResponse[];
  await transactionDone(transaction);
  database.close();

  const matchingResponses = responses.filter((response) => {
    const responseUrl = new URL(response.url);
    return (
      responseUrl.pathname === "/api/exercise-block" &&
      responseUrl.searchParams.get("workout_date") === mutation.body.workout_date
    );
  });

  await Promise.all(
    matchingResponses.map(async (response) => {
      const networkResponse = await fetch(response.url, {
        credentials: "include",
      });
      if (!networkResponse.ok) {
        return;
      }
      await putCachedResponse(
        mutation.userId,
        response.url,
        await networkResponse.json()
      );
    })
  );
}

async function postMutation(mutation: PendingSetMutation): Promise<unknown> {
  const response = await fetch(mutation.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(mutation.body),
  });

  if (!response.ok) {
    throw await responseError(response);
  }
  return response.json();
}

export async function submitSetWithOfflineQueue(input: {
  url: string;
  workoutDate: string;
  exerciseName: string;
  weight: number;
  reps: number;
  note: string | null;
}): Promise<OfflineSubmitResult> {
  const userId = getActiveOfflineUser();
  if (!userId) {
    throw new Error("无法确认当前用户，请先联网登录一次");
  }

  const clientMutationId = createClientMutationId();
  const mutation: PendingSetMutation = {
    id: clientMutationId,
    userId,
    url: new URL(input.url, window.location.origin).toString(),
    body: {
      workout_date: input.workoutDate,
      exercise_name: input.exerciseName,
      sets: [
        {
          weight: input.weight,
          reps: input.reps,
          note: input.note,
          client_mutation_id: clientMutationId,
        },
      ],
    },
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  };

  if (navigator.onLine) {
    try {
      const data = await postMutation(mutation);
      return { status: "synced", clientMutationId, data };
    } catch (error) {
      if (error instanceof OfflineHttpError) {
        throw error;
      }
    }
  }

  await putPendingMutation(mutation);
  await applyOptimisticSet(mutation);
  notifyStateChanged();
  return { status: "queued", clientMutationId };
}

let activeSync: Promise<OfflineSyncResult> | null = null;

export function syncPendingMutations(): Promise<OfflineSyncResult> {
  if (activeSync) {
    return activeSync;
  }

  activeSync = (async () => {
    const userId = getActiveOfflineUser();
    if (!userId || !navigator.onLine) {
      return {
        synced: 0,
        failed: 0,
        pending: userId ? await getPendingMutationCount() : 0,
      };
    }

    const mutations = await getPendingMutations(userId);
    let synced = 0;
    let failed = 0;

    for (const mutation of mutations) {
      try {
        await postMutation(mutation);
        await deletePendingMutation(mutation.id);
        await refreshExerciseBlockCaches(mutation);
        synced += 1;
      } catch (error) {
        await updatePendingMutation(mutation, error);
        failed += 1;

        if (!(error instanceof OfflineHttpError) || error.status === 401) {
          break;
        }
      }
    }

    const pending = await getPendingMutationCount();
    notifyStateChanged();
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_EVENT, {
        detail: { synced, failed, pending },
      })
    );
    return { synced, failed, pending };
  })().finally(() => {
    activeSync = null;
  });

  return activeSync;
}

export async function clearOfflineDataForActiveUser(): Promise<void> {
  const userId = getActiveOfflineUser();
  if (!userId) {
    return;
  }

  const database = await openDatabase();
  const transaction = database.transaction(
    [RESPONSE_STORE, MUTATION_STORE],
    "readwrite"
  );

  for (const storeName of [RESPONSE_STORE, MUTATION_STORE]) {
    const index = transaction.objectStore(storeName).index("userId");
    const keys = await requestToPromise(index.getAllKeys(userId));
    for (const key of keys) {
      transaction.objectStore(storeName).delete(key);
    }
  }

  await transactionDone(transaction);
  database.close();
  window.localStorage.removeItem(ACTIVE_USER_KEY);

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "CLEAR_PRIVATE_CACHE" });
  }
  notifyStateChanged();
}
