import { describe, expect, test } from "bun:test";
import { formatPublishedAgo, formatTimeAgo } from "./i18n";
import { localeFormats } from "./i18n/localeFormats";

describe("relative time formatting", () => {
  test("omits malformed timestamps instead of throwing during card rendering", () => {
    expect(formatTimeAgo("not-a-timestamp", "en")).toBe("");
    expect(formatTimeAgo(" ", "pl")).toBe("");
  });

  test("omits non-finite pre-parsed relative values", () => {
    expect(formatPublishedAgo({ value: Number.NaN, unit: "day" }, "en")).toBe("");
    expect(formatPublishedAgo({ value: Number.POSITIVE_INFINITY, unit: "year" }, "de")).toBe("");
  });
});

test("supports plural rules for the expanded language catalogue", () => {
  expect(localeFormats.fr.videoCount(1).includes("vidéo")).toBe(true);
  expect(localeFormats.es.videoCount(2).includes("vídeos")).toBe(true);
  expect(localeFormats["pt-BR"].videoCount(5).includes("vídeos")).toBe(true);
  expect(localeFormats.ru.videoCount(2).includes("видео")).toBe(true);
  expect(localeFormats.ja.videoCount(3).includes("動画")).toBe(true);
});
