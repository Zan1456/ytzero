import { describe, expect, test } from "bun:test";
import { formatBookmarkTime, parseBookmarkTime } from "./bookmarkTime";

describe("bookmark timestamps", () => {
  test("formats short and long playback positions", () => {
    expect(formatBookmarkTime(65.9)).toBe("1:05");
    expect(formatBookmarkTime(3723)).toBe("1:02:03");
  });

  test("parses seconds, minutes and hours while rejecting malformed values", () => {
    expect(parseBookmarkTime("45")).toBe(45);
    expect(parseBookmarkTime("12:34")).toBe(754);
    expect(parseBookmarkTime("1:02:03")).toBe(3723);
    expect(parseBookmarkTime("2:75")).toBe(null);
    expect(parseBookmarkTime("now")).toBe(null);
  });
});
