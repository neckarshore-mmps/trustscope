import { describe, expect, it } from "vitest";
import { AtCapacityError, ConcurrencyGate } from "./concurrency-gate";

/** A promise we resolve by hand, to hold a gated task "in flight" deterministically. */
function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ConcurrencyGate", () => {
  it("allows up to `max` tasks to run concurrently", async () => {
    const gate = new ConcurrencyGate(2);
    const a = deferred();
    const b = deferred();
    let concurrent = 0;
    let peak = 0;

    const wrap = (d: { promise: Promise<void> }) =>
      gate.run(async () => {
        concurrent++;
        peak = Math.max(peak, concurrent);
        await d.promise;
        concurrent--;
      });

    const p1 = wrap(a);
    const p2 = wrap(b);
    // both slots taken, both running
    expect(peak).toBe(2);

    a.resolve();
    b.resolve();
    await Promise.all([p1, p2]);
    expect(peak).toBe(2);
  });

  it("rejects with AtCapacityError when all slots are in flight", async () => {
    const gate = new ConcurrencyGate(1);
    const held = deferred();
    const inFlight = gate.run(() => held.promise);

    await expect(gate.run(async () => "should not run")).rejects.toBeInstanceOf(
      AtCapacityError,
    );

    held.resolve();
    await inFlight;
  });

  it("never spawns more than `max` under a burst of N distinct tasks", async () => {
    const gate = new ConcurrencyGate(2);
    const gates = Array.from({ length: 10 }, () => deferred());
    let concurrent = 0;
    let peak = 0;
    let started = 0;

    const promises = gates.map((d) =>
      gate.run(async () => {
        started++;
        concurrent++;
        peak = Math.max(peak, concurrent);
        await d.promise;
        concurrent--;
      }),
    );
    // The 2 that got slots are pending; resolve them so the promises can settle.
    gates.forEach((d) => d.resolve());
    const results = await Promise.allSettled(promises);

    // At most `max` tasks ever entered the critical section — the rest were rejected.
    expect(peak).toBeLessThanOrEqual(2);
    expect(started).toBeLessThanOrEqual(2);
    const rejected = results.filter((r) => r.status === "rejected");
    expect(rejected.length).toBe(8);
    expect(rejected.every((r) => (r as PromiseRejectedResult).reason instanceof AtCapacityError)).toBe(true);
  });

  it("releases a slot after a task completes, allowing a later task", async () => {
    const gate = new ConcurrencyGate(1);
    const first = deferred();
    const p1 = gate.run(() => first.promise);
    first.resolve();
    await p1;

    // slot is free again
    const p2 = gate.run(async () => "ran");
    await expect(p2).resolves.toBe("ran");
  });

  it("releases a slot even when the task throws", async () => {
    const gate = new ConcurrencyGate(1);
    await expect(
      gate.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    // the failed task must not leak its slot
    await expect(gate.run(async () => "ok")).resolves.toBe("ok");
  });
});
