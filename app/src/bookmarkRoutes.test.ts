import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = mkdtempSync(resolve(tmpdir(), "ytzero-bookmark-routes-test-"));
let result: Record<string, any> = {};

beforeAll(async () => {
  const process = Bun.spawn(["bun", "app/tests/bookmarkHarness.ts"], {
    cwd: resolve(import.meta.dir, "../.."),
    env: { ...Bun.env, DB_PATH: resolve(root, "db", "source.db"), AVATAR_DIR: resolve(root, "avatars") },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited,
  ]);
  if (exitCode !== 0) throw new Error(`Bookmark harness failed:\n${stderr}\n${stdout}`);
  const line = stdout.split("\n").find((entry) => entry.startsWith("RESULT "));
  if (!line) throw new Error(`Bookmark harness returned no result:\n${stdout}`);
  result = JSON.parse(line.slice("RESULT ".length));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("bookmark routes", () => {
  test("creates and updates one bookmark per profile and video", () => {
    expect(result.firstStatus).toBe(200);
    expect(result.updateStatus).toBe(200);
    expect(result.stableId).toBe(true);
    expect(result.roundedPosition).toBe(12.3);
    expect(result.secondaryBefore).toBeNull();
  });

  test("lists enriched bookmark context including inherited channel tags", () => {
    expect(result.listStatus).toBe(200);
    expect(result.listCount).toBe(1);
    expect(result.listDescription).toBe("Updated note");
    expect(result.channelTagSource).toBe("channel");
  });

  test("validates writes and isolates deletion to the active profile", () => {
    expect(result.invalidStatus).toBe(400);
    expect(result.missingStatus).toBe(404);
    expect(result.deleteStatus).toBe(200);
    expect(result.primaryRemaining).toBe(0);
    expect(result.secondaryRemaining).toBe(1);
  });
});
