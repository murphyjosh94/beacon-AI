"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type StudioSnapshot,
  type StudioState,
  useStudio,
} from "./StudioProvider";

export type StudioAutosaveStatus =
  | "idle"
  | "waiting"
  | "saving"
  | "saved"
  | "offline"
  | "conflict"
  | "failed";

export type StudioAutosaveReason =
  | "manual"
  | "debounce"
  | "interval"
  | "visibility"
  | "pagehide"
  | "online"
  | "recovery";

export type StudioAutosaveVersion = {
  id: string;
  projectId: string;
  projectVersion: number;
  checksum: string;
  snapshot: StudioSnapshot;
  createdAt: string;
  reason: StudioAutosaveReason;
  source: "local" | "cloud";
  deviceId: string;
};

export type StudioAutosaveConflict = {
  projectId: string;
  local: StudioAutosaveVersion;
  remote: StudioAutosaveVersion;
  detectedAt: string;
};

export type StudioAutosaveSaveContext = {
  reason: StudioAutosaveReason;
  signal: AbortSignal;
  checksum: string;
  previousChecksum: string | null;
  deviceId: string;
};

export type StudioAutosaveCloudResult = {
  savedAt?: string;
  checksum?: string;
  projectVersion?: number;
  remoteVersion?: StudioAutosaveVersion | null;
};

export type StudioAutosaveOptions = {
  enabled?: boolean;
  debounceMs?: number;
  intervalMs?: number;
  maxVersions?: number;
  localRecovery?: boolean;
  saveOnVisibilityChange?: boolean;
  saveOnPageHide?: boolean;
  warnBeforeUnload?: boolean;
  retryAttempts?: number;
  retryBaseDelayMs?: number;
  retryMaximumDelayMs?: number;
  storageKeyPrefix?: string;
  save?: (
    snapshot: StudioSnapshot,
    context: StudioAutosaveSaveContext,
  ) => Promise<StudioAutosaveCloudResult | void> | StudioAutosaveCloudResult | void;
  loadRemoteVersion?: (
    projectId: string,
    signal: AbortSignal,
  ) => Promise<StudioAutosaveVersion | null>;
  onStatusChange?: (status: StudioAutosaveStatus) => void;
  onSaved?: (version: StudioAutosaveVersion) => void;
  onFailed?: (error: Error) => void;
  onConflict?: (conflict: StudioAutosaveConflict) => void;
  onRecoveryAvailable?: (version: StudioAutosaveVersion) => void;
};

export type StudioAutosaveController = {
  status: StudioAutosaveStatus;
  enabled: boolean;
  online: boolean;
  lastSavedAt: string | null;
  lastChecksum: string | null;
  error: Error | null;
  conflict: StudioAutosaveConflict | null;
  recovery: StudioAutosaveVersion | null;
  pending: boolean;
  saveNow: (reason?: StudioAutosaveReason) => Promise<boolean>;
  retry: () => Promise<boolean>;
  cancel: () => void;
  restoreRecovery: () => boolean;
  discardRecovery: () => Promise<void>;
  resolveConflict: (
    strategy: "keep-local" | "use-remote",
  ) => Promise<boolean>;
  listVersions: () => Promise<StudioAutosaveVersion[]>;
  restoreVersion: (versionId: string) => Promise<boolean>;
  deleteLocalVersions: () => Promise<void>;
};

type StoredAutosaveRecord = {
  key: string;
  projectId: string;
  version: StudioAutosaveVersion;
};

const AUTOSAVE_DATABASE_NAME = "beacon-studio";
const AUTOSAVE_DATABASE_VERSION = 1;
const AUTOSAVE_STORE_NAME = "autosave-versions";
const DEFAULT_STORAGE_KEY_PREFIX = "beacon-studio:autosave";
const DEFAULT_DEBOUNCE_MS = 1_500;
const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_MAX_VERSIONS = 20;
const DEFAULT_RETRY_ATTEMPTS = 4;
const DEFAULT_RETRY_BASE_DELAY_MS = 750;
const DEFAULT_RETRY_MAXIMUM_DELAY_MS = 12_000;

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function snapshotFromState(state: StudioState): StudioSnapshot {
  return {
    project: cloneValue(state.project),
    timeline: cloneValue(state.timeline),
    assets: cloneValue(state.assets),
    selection: cloneValue(state.selection),
    guides: cloneValue(state.guides),
    preferences: cloneValue(state.preferences),
    panels: cloneValue(state.panels),
    renderQueue: cloneValue(state.renderQueue),
    activeTool: state.activeTool,
  };
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  const normalise = (input: unknown): unknown => {
    if (input === null || typeof input !== "object") {
      return input;
    }

    if (seen.has(input as object)) {
      return "[Circular]";
    }

    seen.add(input as object);

    if (Array.isArray(input)) {
      return input.map(normalise);
    }

    return Object.keys(input as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalise(
          (input as Record<string, unknown>)[key],
        );
        return result;
      }, {});
  };

  return JSON.stringify(normalise(value));
}

function fallbackHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function createStudioSnapshotChecksum(
  snapshot: StudioSnapshot,
): Promise<string> {
  const content = stableStringify(snapshot);

  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof TextEncoder !== "undefined"
  ) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(content),
    );

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return fallbackHash(content);
}

function getDeviceId(storageKeyPrefix: string): string {
  const key = `${storageKeyPrefix}:device`;

  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = window.localStorage.getItem(key);

    if (existing) {
      return existing;
    }

    const created = createId("device");
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return createId("device");
  }
}

function versionStorageKey(
  prefix: string,
  projectId: string,
  versionId: string,
): string {
  return `${prefix}:${projectId}:${versionId}`;
}

function projectStoragePrefix(
  prefix: string,
  projectId: string,
): string {
  return `${prefix}:${projectId}:`;
}

function openAutosaveDatabase(): Promise<IDBDatabase | null> {
  if (
    typeof window === "undefined" ||
    typeof window.indexedDB === "undefined"
  ) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      AUTOSAVE_DATABASE_NAME,
      AUTOSAVE_DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(AUTOSAVE_STORE_NAME)) {
        const store = database.createObjectStore(
          AUTOSAVE_STORE_NAME,
          {
            keyPath: "key",
          },
        );

        store.createIndex("projectId", "projectId", {
          unique: false,
        });
        store.createIndex(
          "createdAt",
          "version.createdAt",
          {
            unique: false,
          },
        );
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ??
          new Error("Could not open the Studio autosave database."),
      );
  });
}

async function writeVersionToIndexedDb(
  prefix: string,
  version: StudioAutosaveVersion,
): Promise<boolean> {
  const database = await openAutosaveDatabase();

  if (!database) return false;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      AUTOSAVE_STORE_NAME,
      "readwrite",
    );
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);

    const record: StoredAutosaveRecord = {
      key: versionStorageKey(prefix, version.projectId, version.id),
      projectId: version.projectId,
      version,
    };

    store.put(record);

    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };
    transaction.onerror = () => {
      const error =
        transaction.error ??
        new Error("Could not write the Studio recovery version.");
      database.close();
      reject(error);
    };
  });
}

async function readVersionsFromIndexedDb(
  projectId: string,
): Promise<StudioAutosaveVersion[] | null> {
  const database = await openAutosaveDatabase();

  if (!database) return null;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      AUTOSAVE_STORE_NAME,
      "readonly",
    );
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
    const index = store.index("projectId");
    const request = index.getAll(projectId);

    request.onsuccess = () => {
      const records = request.result as StoredAutosaveRecord[];
      database.close();

      resolve(
        records
          .map((record) => record.version)
          .sort(
            (left, right) =>
              Date.parse(right.createdAt) -
              Date.parse(left.createdAt),
          ),
      );
    };

    request.onerror = () => {
      const error =
        request.error ??
        new Error("Could not read Studio recovery versions.");
      database.close();
      reject(error);
    };
  });
}

async function deleteVersionFromIndexedDb(
  prefix: string,
  projectId: string,
  versionId: string,
): Promise<boolean> {
  const database = await openAutosaveDatabase();

  if (!database) return false;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      AUTOSAVE_STORE_NAME,
      "readwrite",
    );

    transaction
      .objectStore(AUTOSAVE_STORE_NAME)
      .delete(versionStorageKey(prefix, projectId, versionId));

    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };

    transaction.onerror = () => {
      const error =
        transaction.error ??
        new Error("Could not delete the Studio recovery version.");
      database.close();
      reject(error);
    };
  });
}

async function clearProjectFromIndexedDb(
  projectId: string,
): Promise<boolean> {
  const database = await openAutosaveDatabase();

  if (!database) return false;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      AUTOSAVE_STORE_NAME,
      "readwrite",
    );
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
    const index = store.index("projectId");
    const request = index.openCursor(IDBKeyRange.only(projectId));

    request.onsuccess = () => {
      const cursor = request.result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };

    transaction.onerror = () => {
      const error =
        transaction.error ??
        new Error("Could not clear Studio recovery versions.");
      database.close();
      reject(error);
    };
  });
}

function writeVersionToLocalStorage(
  prefix: string,
  version: StudioAutosaveVersion,
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    versionStorageKey(prefix, version.projectId, version.id),
    JSON.stringify(version),
  );
}

function readVersionsFromLocalStorage(
  prefix: string,
  projectId: string,
): StudioAutosaveVersion[] {
  if (typeof window === "undefined") return [];

  const keyPrefix = projectStoragePrefix(prefix, projectId);
  const versions: StudioAutosaveVersion[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(keyPrefix)) continue;

    try {
      const raw = window.localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw) as StudioAutosaveVersion;

      if (
        parsed.projectId === projectId &&
        parsed.snapshot &&
        parsed.checksum
      ) {
        versions.push(parsed);
      }
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  return versions.sort(
    (left, right) =>
      Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

function deleteVersionFromLocalStorage(
  prefix: string,
  projectId: string,
  versionId: string,
): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(
    versionStorageKey(prefix, projectId, versionId),
  );
}

function clearProjectFromLocalStorage(
  prefix: string,
  projectId: string,
): void {
  if (typeof window === "undefined") return;

  const keyPrefix = projectStoragePrefix(prefix, projectId);
  const keys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(keyPrefix)) {
      keys.push(key);
    }
  }

  keys.forEach((key) => window.localStorage.removeItem(key));
}

async function saveLocalVersion(
  prefix: string,
  version: StudioAutosaveVersion,
): Promise<void> {
  try {
    const written = await writeVersionToIndexedDb(prefix, version);

    if (written) return;
  } catch {
    // Fall through to localStorage.
  }

  writeVersionToLocalStorage(prefix, version);
}

async function loadLocalVersions(
  prefix: string,
  projectId: string,
): Promise<StudioAutosaveVersion[]> {
  try {
    const indexedVersions =
      await readVersionsFromIndexedDb(projectId);

    if (indexedVersions !== null) {
      return indexedVersions;
    }
  } catch {
    // Fall through to localStorage.
  }

  return readVersionsFromLocalStorage(prefix, projectId);
}

async function deleteLocalVersion(
  prefix: string,
  projectId: string,
  versionId: string,
): Promise<void> {
  try {
    const deleted = await deleteVersionFromIndexedDb(
      prefix,
      projectId,
      versionId,
    );

    if (deleted) return;
  } catch {
    // Fall through to localStorage.
  }

  deleteVersionFromLocalStorage(prefix, projectId, versionId);
}

async function clearLocalProject(
  prefix: string,
  projectId: string,
): Promise<void> {
  try {
    const cleared = await clearProjectFromIndexedDb(projectId);

    if (cleared) return;
  } catch {
    // Fall through to localStorage.
  }

  clearProjectFromLocalStorage(prefix, projectId);
}

async function pruneLocalVersions(
  prefix: string,
  projectId: string,
  maximum: number,
): Promise<void> {
  const versions = await loadLocalVersions(prefix, projectId);
  const excess = versions.slice(Math.max(1, maximum));

  await Promise.all(
    excess.map((version) =>
      deleteLocalVersion(prefix, projectId, version.id),
    ),
  );
}

function sleep(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Autosave was cancelled.", "AbortError"));
      return;
    }

    const timer = window.setTimeout(resolve, milliseconds);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(
          new DOMException("Autosave was cancelled.", "AbortError"),
        );
      },
      { once: true },
    );
  });
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;

  return new Error(
    typeof error === "string"
      ? error
      : "Beacon Studio could not save the project.",
  );
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

function versionsConflict(
  local: StudioAutosaveVersion,
  remote: StudioAutosaveVersion,
): boolean {
  if (local.checksum === remote.checksum) return false;

  const localCreated = Date.parse(local.createdAt);
  const remoteCreated = Date.parse(remote.createdAt);

  return (
    remote.projectVersion > local.projectVersion ||
    (remote.projectVersion === local.projectVersion &&
      remoteCreated > localCreated &&
      remote.deviceId !== local.deviceId)
  );
}

export function createStudioAutosaveVersion(
  snapshot: StudioSnapshot,
  input: {
    checksum: string;
    reason: StudioAutosaveReason;
    source?: "local" | "cloud";
    deviceId: string;
    createdAt?: string;
  },
): StudioAutosaveVersion {
  return {
    id: createId("autosave"),
    projectId: snapshot.project.id,
    projectVersion: snapshot.project.version,
    checksum: input.checksum,
    snapshot: cloneValue(snapshot),
    createdAt: input.createdAt ?? new Date().toISOString(),
    reason: input.reason,
    source: input.source ?? "local",
    deviceId: input.deviceId,
  };
}

export function serialiseStudioAutosaveVersion(
  version: StudioAutosaveVersion,
): string {
  return JSON.stringify(version);
}

export function parseStudioAutosaveVersion(
  value: string,
): StudioAutosaveVersion {
  const parsed = JSON.parse(value) as StudioAutosaveVersion;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.id ||
    !parsed.projectId ||
    !parsed.snapshot ||
    !parsed.checksum
  ) {
    throw new Error("The Studio recovery data is invalid.");
  }

  return parsed;
}

export function useStudioAutosave(
  options: StudioAutosaveOptions = {},
): StudioAutosaveController {
  const { state, actions, refs } = useStudio();

  const {
    enabled = state.preferences.autosaveEnabled,
    debounceMs =
      state.preferences.autosaveDelayMs ?? DEFAULT_DEBOUNCE_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    maxVersions = DEFAULT_MAX_VERSIONS,
    localRecovery = true,
    saveOnVisibilityChange = true,
    saveOnPageHide = true,
    warnBeforeUnload = true,
    retryAttempts = DEFAULT_RETRY_ATTEMPTS,
    retryBaseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
    retryMaximumDelayMs = DEFAULT_RETRY_MAXIMUM_DELAY_MS,
    storageKeyPrefix = DEFAULT_STORAGE_KEY_PREFIX,
    save,
    loadRemoteVersion,
    onStatusChange,
    onSaved,
    onFailed,
    onConflict,
    onRecoveryAvailable,
  } = options;

  const [status, setStatusState] =
    useState<StudioAutosaveStatus>("idle");
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    state.lastSavedAt
      ? new Date(state.lastSavedAt).toISOString()
      : null,
  );
  const [lastChecksum, setLastChecksum] =
    useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [conflict, setConflict] =
    useState<StudioAutosaveConflict | null>(null);
  const [recovery, setRecovery] =
    useState<StudioAutosaveVersion | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const intervalTimerRef = useRef<number | null>(null);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const queuedReasonRef = useRef<StudioAutosaveReason | null>(null);
  const mountedRef = useRef(true);
  const lastAttemptReasonRef =
    useRef<StudioAutosaveReason>("manual");
  const optionsRef = useRef(options);
  const deviceIdRef = useRef<string>("");

  optionsRef.current = options;

  const projectId = state.project.id;
  const pending =
    status === "waiting" || status === "saving";

  useEffect(() => {
    deviceIdRef.current = getDeviceId(storageKeyPrefix);
  }, [storageKeyPrefix]);

  const setStatus = useCallback(
    (nextStatus: StudioAutosaveStatus) => {
      if (!mountedRef.current) return;

      setStatusState(nextStatus);
      optionsRef.current.onStatusChange?.(nextStatus);
    },
    [],
  );

  const saveNow = useCallback(
    async (
      reason: StudioAutosaveReason = "manual",
    ): Promise<boolean> => {
      lastAttemptReasonRef.current = reason;

      if (!enabled) return false;

      if (savePromiseRef.current) {
        queuedReasonRef.current = reason;
        return savePromiseRef.current;
      }

      const currentState = refs.stateRef.current;

      if (!currentState.dirty && reason !== "manual") {
        setStatus(lastChecksum ? "saved" : "idle");
        return true;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const task = (async (): Promise<boolean> => {
        setError(null);

        if (!online && save) {
          setStatus("offline");
        } else {
          setStatus("saving");
        }

        const snapshot = snapshotFromState(
          refs.stateRef.current,
        );
        const checksum =
          await createStudioSnapshotChecksum(snapshot);

        if (
          checksum === lastChecksum &&
          reason !== "manual"
        ) {
          actions.markSaved();
          setStatus("saved");
          return true;
        }

        const localVersion = createStudioAutosaveVersion(
          snapshot,
          {
            checksum,
            reason,
            deviceId:
              deviceIdRef.current ||
              getDeviceId(storageKeyPrefix),
          },
        );

        if (localRecovery) {
          await saveLocalVersion(storageKeyPrefix, localVersion);
          await pruneLocalVersions(
            storageKeyPrefix,
            snapshot.project.id,
            maxVersions,
          );
        }

        if (
          loadRemoteVersion &&
          online &&
          !controller.signal.aborted
        ) {
          const remote = await loadRemoteVersion(
            snapshot.project.id,
            controller.signal,
          );

          if (remote && versionsConflict(localVersion, remote)) {
            const detectedConflict: StudioAutosaveConflict = {
              projectId: snapshot.project.id,
              local: localVersion,
              remote,
              detectedAt: new Date().toISOString(),
            };

            setConflict(detectedConflict);
            setStatus("conflict");
            optionsRef.current.onConflict?.(detectedConflict);
            return false;
          }
        }

        if (save && online) {
          let attempt = 0;
          let cloudResult:
            | StudioAutosaveCloudResult
            | void = undefined;

          while (attempt <= retryAttempts) {
            try {
              cloudResult = await save(snapshot, {
                reason,
                signal: controller.signal,
                checksum,
                previousChecksum: lastChecksum,
                deviceId: localVersion.deviceId,
              });
              break;
            } catch (saveError) {
              if (
                controller.signal.aborted ||
                isAbortError(saveError)
              ) {
                throw saveError;
              }

              if (attempt >= retryAttempts) {
                throw saveError;
              }

              const delay = Math.min(
                retryBaseDelayMs * 2 ** attempt,
                retryMaximumDelayMs,
              );

              attempt += 1;
              await sleep(delay, controller.signal);
            }
          }

          if (
            cloudResult?.remoteVersion &&
            versionsConflict(
              localVersion,
              cloudResult.remoteVersion,
            )
          ) {
            const detectedConflict: StudioAutosaveConflict = {
              projectId: snapshot.project.id,
              local: localVersion,
              remote: cloudResult.remoteVersion,
              detectedAt: new Date().toISOString(),
            };

            setConflict(detectedConflict);
            setStatus("conflict");
            optionsRef.current.onConflict?.(detectedConflict);
            return false;
          }
        }

        const savedAt = new Date().toISOString();

        actions.markSaved();
        actions.emit({
          type: "autosave:completed",
          savedAt: Date.parse(savedAt),
        });

        setLastChecksum(checksum);
        setLastSavedAt(savedAt);
        setRecovery(null);
        setConflict(null);
        setStatus(online ? "saved" : "offline");
        optionsRef.current.onSaved?.(localVersion);

        return true;
      })()
        .catch((caughtError: unknown) => {
          if (
            controller.signal.aborted ||
            isAbortError(caughtError)
          ) {
            return false;
          }

          const normalisedError = toError(caughtError);
          setError(normalisedError);
          setStatus(online ? "failed" : "offline");
          actions.setError(normalisedError.message);
          actions.emit({
            type: "autosave:failed",
            error: normalisedError,
          });
          optionsRef.current.onFailed?.(normalisedError);

          return false;
        })
        .finally(() => {
          abortControllerRef.current = null;
          savePromiseRef.current = null;

          const queuedReason = queuedReasonRef.current;
          queuedReasonRef.current = null;

          if (
            queuedReason &&
            mountedRef.current &&
            refs.stateRef.current.dirty
          ) {
            window.setTimeout(() => {
              void saveNow(queuedReason);
            }, 0);
          }
        });

      savePromiseRef.current = task;
      return task;
    },
    [
      actions,
      enabled,
      lastChecksum,
      loadRemoteVersion,
      localRecovery,
      maxVersions,
      online,
      refs.stateRef,
      retryAttempts,
      retryBaseDelayMs,
      retryMaximumDelayMs,
      save,
      setStatus,
      storageKeyPrefix,
    ],
  );

  const cancel = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    queuedReasonRef.current = null;
    setStatus(state.dirty ? "waiting" : "idle");
  }, [setStatus, state.dirty]);

  const retry = useCallback(
    () => saveNow(lastAttemptReasonRef.current),
    [saveNow],
  );

  const listVersions = useCallback(
    () => loadLocalVersions(storageKeyPrefix, projectId),
    [projectId, storageKeyPrefix],
  );

  const restoreVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      const versions = await listVersions();
      const version = versions.find(
        (candidate) => candidate.id === versionId,
      );

      if (!version) return false;

      actions.resetStudio(version.snapshot);
      setRecovery(null);
      setConflict(null);
      setLastChecksum(version.checksum);
      setStatus("saved");

      return true;
    },
    [actions, listVersions, setStatus],
  );

  const restoreRecovery = useCallback((): boolean => {
    if (!recovery) return false;

    actions.resetStudio(recovery.snapshot);
    setLastChecksum(recovery.checksum);
    setRecovery(null);
    setStatus("saved");

    return true;
  }, [actions, recovery, setStatus]);

  const discardRecovery = useCallback(async (): Promise<void> => {
    if (!recovery) return;

    await deleteLocalVersion(
      storageKeyPrefix,
      recovery.projectId,
      recovery.id,
    );
    setRecovery(null);
  }, [recovery, storageKeyPrefix]);

  const deleteLocalVersions =
    useCallback(async (): Promise<void> => {
      await clearLocalProject(storageKeyPrefix, projectId);
      setRecovery(null);
    }, [projectId, storageKeyPrefix]);

  const resolveConflict = useCallback(
    async (
      strategy: "keep-local" | "use-remote",
    ): Promise<boolean> => {
      if (!conflict) return false;

      if (strategy === "use-remote") {
        actions.resetStudio(conflict.remote.snapshot);
        setLastChecksum(conflict.remote.checksum);
        setLastSavedAt(conflict.remote.createdAt);
        setConflict(null);
        setStatus("saved");
        return true;
      }

      setConflict(null);
      setLastChecksum(null);

      return saveNow("manual");
    },
    [actions, conflict, saveNow, setStatus],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      if (intervalTimerRef.current !== null) {
        window.clearInterval(intervalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!localRecovery || !projectId) return;

    void loadLocalVersions(storageKeyPrefix, projectId).then(
      async (versions) => {
        if (cancelled || versions.length === 0) return;

        const newest = versions[0];
        const currentSnapshot = snapshotFromState(
          refs.stateRef.current,
        );
        const currentChecksum =
          await createStudioSnapshotChecksum(currentSnapshot);

        if (
          cancelled ||
          newest.checksum === currentChecksum
        ) {
          return;
        }

        if (
          Date.parse(newest.createdAt) >
          Date.parse(
            refs.stateRef.current.project.updatedAt ??
              refs.stateRef.current.project.createdAt,
          )
        ) {
          setRecovery(newest);
          optionsRef.current.onRecoveryAvailable?.(newest);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [
    localRecovery,
    projectId,
    refs.stateRef,
    storageKeyPrefix,
  ]);

  useEffect(() => {
    if (!enabled || !state.dirty) {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (!state.dirty && status === "waiting") {
        setStatus(lastChecksum ? "saved" : "idle");
      }

      return;
    }

    setStatus(online ? "waiting" : "offline");

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void saveNow("debounce");
    }, Math.max(250, debounceMs));

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    debounceMs,
    enabled,
    lastChecksum,
    online,
    saveNow,
    setStatus,
    state.dirty,
    state.project.version,
    status,
  ]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    intervalTimerRef.current = window.setInterval(() => {
      if (refs.stateRef.current.dirty) {
        void saveNow("interval");
      }
    }, Math.max(5_000, intervalMs));

    return () => {
      if (intervalTimerRef.current !== null) {
        window.clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [enabled, intervalMs, refs.stateRef, saveNow]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);

      if (refs.stateRef.current.dirty) {
        void saveNow("online");
      } else {
        setStatus(lastChecksum ? "saved" : "idle");
      }
    };

    const handleOffline = () => {
      setOnline(false);

      if (refs.stateRef.current.dirty) {
        setStatus("offline");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [
    lastChecksum,
    refs.stateRef,
    saveNow,
    setStatus,
  ]);

  useEffect(() => {
    if (!saveOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        refs.stateRef.current.dirty
      ) {
        void saveNow("visibility");
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [refs.stateRef, saveNow, saveOnVisibilityChange]);

  useEffect(() => {
    if (!saveOnPageHide) return;

    const handlePageHide = () => {
      if (refs.stateRef.current.dirty) {
        void saveNow("pagehide");
      }
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [refs.stateRef, saveNow, saveOnPageHide]);

  useEffect(() => {
    if (!warnBeforeUnload) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!refs.stateRef.current.dirty) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [refs.stateRef, warnBeforeUnload]);

  return useMemo(
    () => ({
      status,
      enabled,
      online,
      lastSavedAt,
      lastChecksum,
      error,
      conflict,
      recovery,
      pending,
      saveNow,
      retry,
      cancel,
      restoreRecovery,
      discardRecovery,
      resolveConflict,
      listVersions,
      restoreVersion,
      deleteLocalVersions,
    }),
    [
      cancel,
      conflict,
      deleteLocalVersions,
      discardRecovery,
      enabled,
      error,
      lastChecksum,
      lastSavedAt,
      listVersions,
      online,
      pending,
      recovery,
      resolveConflict,
      restoreRecovery,
      restoreVersion,
      retry,
      saveNow,
      status,
    ],
  );
}

export function formatStudioAutosaveStatus(
  status: StudioAutosaveStatus,
): string {
  switch (status) {
    case "waiting":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "offline":
      return "Saved locally — offline";
    case "conflict":
      return "Save conflict";
    case "failed":
      return "Save failed";
    default:
      return "Ready";
  }
}

export function isStudioAutosavePending(
  status: StudioAutosaveStatus,
): boolean {
  return status === "waiting" || status === "saving";
}