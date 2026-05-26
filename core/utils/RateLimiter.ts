import { RateLimitError } from "../errors/AppErrors";

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private readonly map = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    // Evict expired entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.map.entries()) {
        if (now - record.windowStart > this.windowMs) this.map.delete(key);
      }
    }, this.windowMs);
  }

  check(clientId: string): void {
    const now = Date.now();
    const record = this.map.get(clientId);
    if (!record || now - record.windowStart > this.windowMs) {
      this.map.set(clientId, { count: 1, windowStart: now });
      return;
    }
    if (record.count >= this.maxRequests) {
      throw new RateLimitError(
        "Too many requests. Please wait before trying again."
      );
    }
    record.count += 1;
  }

  /** Exposed for testing only — resets all state. */
  reset(): void {
    this.map.clear();
  }
}

// Singletons — one per concern
export const uploadRateLimiter = new RateLimiter(10, 60 * 1000);
export const explainRateLimiter = new RateLimiter(5, 60 * 1000);
