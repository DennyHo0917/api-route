export const CHUNK_RELOAD_KEY = 'dist_chunk_reload_at';
export const CHUNK_RECOVERY_WINDOW_MS = 30_000;

const CHUNK_LOAD_ERROR_PATTERN = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk|error loading dynamically imported module/i;

export function isChunkLoadError(error) {
  return CHUNK_LOAD_ERROR_PATTERN.test(String(error?.message || error || ''));
}

export function createChunkRecovery({ getStorage, reload, now = Date.now }) {
  let recovering = false;

  return function recoverFromChunkLoadError(error, { force = false } = {}) {
    if (!force && !isChunkLoadError(error)) return 'ignored';
    if (recovering) return 'recovering';

    try {
      const storage = getStorage();
      const currentTime = now();
      const lastReloadAt = Number(storage.getItem(CHUNK_RELOAD_KEY) || 0);
      if (lastReloadAt > 0 && currentTime - lastReloadAt < CHUNK_RECOVERY_WINDOW_MS) {
        return 'exhausted';
      }
      storage.setItem(CHUNK_RELOAD_KEY, String(currentTime));
    } catch {
      return 'exhausted';
    }

    recovering = true;
    reload();
    return 'recovering';
  };
}
