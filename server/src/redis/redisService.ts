interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

export class RedisService {
  private store = new Map<string, CacheEntry<any>>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  // Token-bucket / rate limit increment with window TTL
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const current = await this.get<number>(key);
    if (current === null) {
      await this.set(key, 1, ttlSeconds);
      return 1;
    }
    const next = current + 1;
    // preserve remaining TTL
    const entry = this.store.get(key);
    this.store.set(key, { value: next, expiresAt: entry?.expiresAt });
    return next;
  }

  // Acquire lock with TTL: returns true if acquired, false if already held (Section 5.7)
  async acquireLock(lockKey: string, ttlSeconds: number = 600): Promise<boolean> {
    const existing = await this.get(lockKey);
    if (existing !== null) {
      return false; // lock held
    }
    await this.set(lockKey, 'locked', ttlSeconds);
    return true;
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.del(lockKey);
  }

  // Clear for tests
  clearAll(): void {
    this.store.clear();
  }
}

export const redis = new RedisService();
