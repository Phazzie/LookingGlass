/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - tests generic rate limiting utility)
- Revision Action Taken: Implemented vi.useFakeTimers to accurately time-travel and verify sliding window resets without adding real-world async overhead.
---
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../RateLimiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests under the maximum limit", () => {
    const rateLimiter = new RateLimiter(5, 60000); // 5 req per minute
    
    expect(rateLimiter.checkLimit("192.168.1.1")).toBe(true);
    expect(rateLimiter.checkLimit("192.168.1.1")).toBe(true);
    expect(rateLimiter.checkLimit("192.168.1.1")).toBe(true);
  });

  it("should block requests when the limit is instantly exceeded", () => {
    const rateLimiter = new RateLimiter(3, 60000); // 3 req per minute

    // Use loop to hit exactly the limit
    for (let i = 0; i < 3; i++) {
        expect(rateLimiter.checkLimit("10.0.0.1")).toBe(true);
    }

    // The 4th request must fail
    expect(rateLimiter.checkLimit("10.0.0.1")).toBe(false);
  });

  it("should maintain independent limits for different client strings", () => {
    const rateLimiter = new RateLimiter(2, 60000);

    // Client A hits limit
    expect(rateLimiter.checkLimit("ClientA")).toBe(true);
    expect(rateLimiter.checkLimit("ClientA")).toBe(true);
    expect(rateLimiter.checkLimit("ClientA")).toBe(false);

    // Client B should still be allowed
    expect(rateLimiter.checkLimit("ClientB")).toBe(true);
    expect(rateLimiter.checkLimit("ClientB")).toBe(true);
    expect(rateLimiter.checkLimit("ClientB")).toBe(false);
  });

  it("should reset the limit accurately after the time window elapses", () => {
    const rateLimiter = new RateLimiter(2, 60000);

    rateLimiter.checkLimit("127.0.0.1");
    rateLimiter.checkLimit("127.0.0.1");
    expect(rateLimiter.checkLimit("127.0.0.1")).toBe(false); // Hit limit

    // Fast-forward time by 61 seconds
    vi.advanceTimersByTime(61000);

    // Request should now be allowed again as a new window begins
    expect(rateLimiter.checkLimit("127.0.0.1")).toBe(true);
  });
});
