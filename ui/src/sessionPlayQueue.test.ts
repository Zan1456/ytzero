import { afterEach, describe, expect, test } from "bun:test";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
} });
const queue = await import("./sessionPlayQueue");

afterEach(() => { values.clear(); queue.clearSessionPlayQueue(); });

describe("session play queue", () => {
  test("keeps order, ignores duplicates and exposes a session context", () => {
    expect(queue.addToSessionPlayQueue({ video_id: "first000001", title: "First", thumbnail: "one", channel_title: "A" })).toBe(true);
    expect(queue.addToSessionPlayQueue({ video_id: "second00002", title: "Second", thumbnail: "two", channel_title: "B" })).toBe(true);
    expect(queue.addToSessionPlayQueue({ video_id: "first000001", title: "Changed", thumbnail: "", channel_title: "" })).toBe(false);
    expect(queue.sessionPlayQueueContext()).toEqual({ version: 1, kind: "session", ids: ["first000001", "second00002"] });
    expect(queue.sessionPlayQueueItems().map((item) => item.title)).toEqual(["First", "Second"]);
  });
  test("removes and clears items", () => {
    queue.addToSessionPlayQueue({ video_id: "first000001", title: "First", thumbnail: "", channel_title: "" });
    queue.removeFromSessionPlayQueue("first000001");
    expect(queue.sessionPlayQueueContext()).toBe(null);
  });
});
