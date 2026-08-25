import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = mkdtempSync(resolve(tmpdir(), "ytzero-shorts-backfill-"));
let result: Record<string, any> = {};

beforeAll(async () => {
  const process = Bun.spawn(["bun", "app/tests/shortsBackfillHarness.ts"], {
    cwd: resolve(import.meta.dir, "../.."),
    env: { ...Bun.env, DB_PATH: resolve(root, "db", "source.db") },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (exitCode !== 0) throw new Error(`Shorts backfill harness failed:\n${stderr}\n${stdout}`);
  const line = stdout.split("\n").find((entry) => entry.startsWith("RESULT "));
  if (!line) throw new Error(`Shorts backfill harness returned no result:\n${stdout}`);
  result = JSON.parse(line.slice("RESULT ".length));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("Shorts backfill", () => {
  test("settles long videos locally and backs off unknown answers", () => {
    expect(result.long).toEqual({ is_short: 0, short_check_attempts: 0 });
    expect(result.afterFirst.is_short).toBeNull();
    expect(result.afterFirst.short_check_attempts).toBe(1);
    expect(result.afterFirst.short_check_next_attempt_at).toBeTruthy();
    expect(result.fetchesBeforeDue).toBe(result.fetchesAfterFirst);
  });

  test("retries when due and retains the recorded attempt after resolution", () => {
    expect(result.afterResolved).toEqual({ is_short: 0, short_check_attempts: 2, short_check_next_attempt_at: null });
  });

  test("atomically claims a request, respects a supplied limit, and records refusal", () => {
    expect(result.concurrent).toEqual({ short_check_attempts: 1 });
    expect(result.concurrentFetches).toBe(1);
    expect(result.limitFetches).toBe(1);
    expect(result.limited.map((row: any) => row.short_check_attempts).sort()).toEqual([0, 1]);
    expect(result.refused.short_check_attempts).toBe(1);
    expect(result.refused.short_check_attempted_at).toBeTruthy();
  });
});
