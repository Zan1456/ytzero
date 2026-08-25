import { describe, expect, test } from "bun:test";
import {
  inferIsShortFromMetadata,
  parseVideoDurationSeconds,
  shortCheckRetryInterval,
  shortCheckRetryMinutes,
} from "./shortClassification";

describe("Shorts metadata classification", () => {
  test("parses catalog clock durations", () => {
    expect(parseVideoDurationSeconds("1:18")).toBe(78);
    expect(parseVideoDurationSeconds("1:02:03")).toBe(3723);
    expect(parseVideoDurationSeconds("3:xx")).toBeNull();
    expect(parseVideoDurationSeconds("180")).toBeNull();
  });

  test("uses only safe local classification facts", () => {
    expect(inferIsShortFromMetadata("Long upload", "3:01")).toBe(false);
    expect(inferIsShortFromMetadata("Long upload", "1:02:03")).toBe(false);
    expect(inferIsShortFromMetadata("Ordinary video", "3:00")).toBeNull();
    expect(inferIsShortFromMetadata("Ordinary video", "0:43")).toBeNull();
    expect(inferIsShortFromMetadata("A CLIP #SHORT", "0:43")).toBe(true);
    expect(inferIsShortFromMetadata("A CLIP #shorts", "3:00")).toBe(true);
  });

  test("prefers the authoritative duration limit over a title hashtag", () => {
    expect(inferIsShortFromMetadata("#shorts compilation", "3:01")).toBe(false);
  });
});

describe("Shorts retry backoff", () => {
  test("grows from half an hour and caps at one day", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(shortCheckRetryMinutes))
      .toEqual([30, 60, 120, 240, 480, 960, 1440, 1440]);
    expect(shortCheckRetryInterval(1)).toBe("+30 minutes");
    expect(shortCheckRetryInterval(99)).toBe("+1440 minutes");
  });
});
