/**
 * A bounded in-process concurrency gate (§1 — /report DoS mitigation).
 *
 * The `/report` on-demand path spawns a ~90s Scorecard subprocess per cache-miss. Unauthenticated
 * and uncapped, an attacker fanning out distinct `repo=` values exhausts the host (CPU / memory /
 * process table). This gate bounds the number of concurrent expensive spawns PER INSTANCE and, when
 * full, rejects fast with {@link AtCapacityError} rather than queueing unboundedly (an unbounded
 * queue is itself a memory-exhaustion vector). Fail-closed: excess load is shed, never absorbed.
 *
 * Vercel Fluid Compute reuses a function instance across concurrent requests, so a module-level
 * singleton gate meaningfully caps spawns within an instance. Cached reads never reach this gate.
 */

/** Thrown when the gate is full — the caller must shed the request, not spawn. */
export class AtCapacityError extends Error {
  constructor(max: number) {
    super(`At capacity: ${max} concurrent operations already in flight`);
    this.name = "AtCapacityError";
  }
}

export class ConcurrencyGate {
  private inFlight = 0;

  constructor(private readonly max: number) {
    if (!Number.isInteger(max) || max < 1) {
      throw new Error(`ConcurrencyGate: max must be a positive integer, got ${max}`);
    }
  }

  /** Number of operations currently holding a slot. */
  get active(): number {
    return this.inFlight;
  }

  /**
   * Run `fn` if a slot is free; otherwise reject with {@link AtCapacityError} WITHOUT running it.
   * The slot is always released — on success and on failure.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.inFlight >= this.max) {
      throw new AtCapacityError(this.max);
    }
    this.inFlight++;
    try {
      return await fn();
    } finally {
      this.inFlight--;
    }
  }
}
