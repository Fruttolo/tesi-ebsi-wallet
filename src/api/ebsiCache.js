/**
 * Cache in memoria per ridurre chiamate API
 */
class EBSICache {
  constructor(ttlMs = 5 * 60 * 1000) {
    // 5 min default
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  /**
   * Salva in cache
   * @param {string} key - Chiave cache
   * @param {any} value - Valore
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Recupera da cache
   * @param {string} key - Chiave cache
   * @returns {any|null} Valore o null se scaduto/assente
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Pulisce cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Rimuove entry scadute
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const ebsiCache = new EBSICache();

// Cleanup automatico ogni 10 minuti
setInterval(() => ebsiCache.cleanup(), 10 * 60 * 1000);
