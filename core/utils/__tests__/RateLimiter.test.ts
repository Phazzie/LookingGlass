import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RateLimiter } from "../RateLimiter";
import { RateLimitError } from "../../errors/AppErrors";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter(3, 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
    limiter.reset();
  });

  it("allows requests up to the limit", () => {
    expect(() => limiter.check("ip1")).not.toThrow();
    expect(() => limiter.check("ip1")).not.toThrow();
    expect(() => limiter.check("ip1")).not.toThrow();
  });

  it("throws RateLimitError when limit is exceeded", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    expect(() => limiter.check("ip1")).toThrow(RateLimitError);
  });

  it("tracks different client IDs independently", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    expect(() => limiter.check("ip2")).not.toThrow();
  });

  it("resets the window after the window duration passes", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    expect(() => limiter.check("ip1")).toThrow(RateLimitError);

    vi.advanceTimersByTime(1001);

    expect(() => limiter.check("ip1")).not.toThrow();
  });

  it("counts again from 1 after window reset", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");

    vi.advanceTimersByTime(1001);

    expect(() => limiter.check("ip1")).not.toThrow();
    expect(() => limiter.check("ip1")).not.toThrow();
    expect(() => limiter.check("ip1")).not.toThrow();
    expect(() => limiter.check("ip1")).toThrow(RateLimitError);
  });

  it("reset() clears all state", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.reset();
    expect(() => limiter.check("ip1")).not.toThrow();
  });
});
