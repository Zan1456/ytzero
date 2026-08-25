import { describe, expect, test } from "bun:test";
import { buildSubtitleAvailability, normalizeSubtitleLanguage } from "./subtitleAvailability";
import { fetchSubtitleTracks } from "./downloader";

describe("subtitle availability", () => {
  test("folds only YouTube's opaque per-track suffix", () => {
    expect(normalizeSubtitleLanguage("en-nP7-2PuUl7o")).toBe("en");
    expect(normalizeSubtitleLanguage("fr-gqnk0mWVyHo")).toBe("fr");
    expect(normalizeSubtitleLanguage("pt-BR")).toBe("pt-BR");
    expect(normalizeSubtitleLanguage("zh-Hans")).toBe("zh-Hans");
    expect(normalizeSubtitleLanguage("zh-Hant")).toBe("zh-Hant");
  });

  test("keeps author tracks, filters automatic captions, and retains fallbacks", () => {
    const available = buildSubtitleAvailability(
      {
        en: [{ name: "English" }],
        "en-nP7-2PuUl7o": [{ name: "English (audio description)" }],
        "pt-BR": [{ name: "Português (Brasil)" }],
      },
      {
        fr: [{ name: "French (auto-generated)" }],
        de: [{ name: "German (auto-generated)" }],
      },
      ["fr"],
    );

    expect(available).toEqual(expect.arrayContaining([
      { lang: "en", label: "English", tracks: ["en", "en-nP7-2PuUl7o"] },
      { lang: "pt-BR", label: "Português (Brasil)", tracks: ["pt-BR"] },
      { lang: "fr", label: "Français", tracks: ["fr"] },
    ]));
    expect(available.some((subtitle) => subtitle.lang === "de")).toBe(false);
  });

  test("uses an author track before an automatic track in the same language", () => {
    const available = buildSubtitleAvailability(
      { fr: [{ name: "French" }] },
      { "fr-gqnk0mWVyHo": [{ name: "French (auto-generated)" }] },
      ["fr"],
    );
    expect(available.find((subtitle) => subtitle.lang === "fr")?.tracks).toEqual(["fr", "fr-gqnk0mWVyHo"]);
  });

  test("retries a rate-limited track once before using the next fallback", async () => {
    const attempts: string[] = [];
    const waits: number[] = [];
    const result = await fetchSubtitleTracks(
      ["fr", "fr-gqnk0mWVyHo"],
      async (track) => {
        attempts.push(track);
        return track === "fr-gqnk0mWVyHo"
          ? { downloaded: true, rateLimited: false }
          : { downloaded: false, rateLimited: true };
      },
      async (ms) => { waits.push(ms); },
    );
    expect(result).toBe(true);
    expect(attempts).toEqual(["fr", "fr", "fr-gqnk0mWVyHo"]);
    expect(waits).toEqual([1500]);
  });
});
