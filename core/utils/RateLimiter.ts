export class RateLimiter {
  private map = new Map<string, { count: number; windowStart: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public checkLimit(clientId: string): boolean {
    const now = Date.now();
    const record = this.map.get(clientId);

    if (!record || now - record.windowStart > this.windowMs) {
      this.map.set(clientId, { count: 1, windowStart: now });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count += 1;
    return true;
  }
}

export const explainRateLimiter = new RateLimiter(5, 60000); // 5 per minute
export const uploadRateLimiter = new RateLimiter(10, 60000); // 10 per minute
