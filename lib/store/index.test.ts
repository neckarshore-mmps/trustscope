import { afterEach, describe, expect, it } from "vitest";
import { createReportStore } from "./index";
import { FileReportStore } from "./file-store";
import { InMemoryReportStore } from "./memory-store";
import { NeonReportStore } from "./neon-store";

const savedUrl = process.env.DATABASE_URL;
afterEach(() => {
  if (savedUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = savedUrl;
});

describe("createReportStore — REPORT_STORE selection", () => {
  it("defaults to the file store", () => {
    expect(createReportStore("file")).toBeInstanceOf(FileReportStore);
    expect(createReportStore(undefined)).toBeInstanceOf(FileReportStore);
  });

  it("selects the in-memory store for 'memory'", () => {
    expect(createReportStore("memory")).toBeInstanceOf(InMemoryReportStore);
  });

  it("selects the Neon store for 'neon' when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgres://user:pass@host/db";
    expect(createReportStore("neon")).toBeInstanceOf(NeonReportStore);
  });

  it("throws a clear error for 'neon' when DATABASE_URL is missing (fail-loud, not silent file fallback)", () => {
    delete process.env.DATABASE_URL;
    expect(() => createReportStore("neon")).toThrow(/DATABASE_URL/);
  });
});
