import { afterEach, describe, expect, test } from "bun:test";
import { fetchChannelPlaylists, fetchChannelVideos, fetchVideoPublishedAt } from "./youtube";
import { isYouTubeBotChallenge, isYouTubeRateLimitError, isYouTubeRefusalError, readYouTubeResponse, YouTubeRefusalError, YouTubeRefusalGate } from "./youtubeRateLimit";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("YouTube rate-limit detection", () => {
  test("recognizes HTTP, throttling and bot-challenge errors without matching unrelated ids", () => {
    for (const message of ["request failed (429)", "Too many requests", "rate-limited", "Please confirm you're not a bot"]) {
      expect(isYouTubeRateLimitError(new Error(message))).toBe(true);
    }
    expect(isYouTubeRateLimitError(new Error("video 1429 changed layout"))).toBe(false);
    expect(isYouTubeRateLimitError(new Error("temporary parser error"))).toBe(false);
  });

  test("rejects successful bot pages and ordinary HTTP 429 responses", async () => {
    expect(isYouTubeBotChallenge("Our systems detected unusual traffic from your network")).toBe(true);
    await expect(readYouTubeResponse(new Response("slow down", { status: 429 }), "request failed")).rejects.toThrow("429");
    await expect(readYouTubeResponse(new Response("Please confirm you’re not a bot"), "request failed")).rejects.toThrow("bot challenge");
  });

  test("propagates a continuation 429 instead of caching a partial channel playlist catalog", async () => {
    const initial = {
      gridPlaylistRenderer: { playlistId: "PL_first", title: { simpleText: "First" }, thumbnail: { thumbnails: [] } },
      continuationItemRenderer: { continuationEndpoint: { continuationCommand: { token: "next" } } },
    };
    const html = `ytInitialData = ${JSON.stringify(initial)}; "INNERTUBE_API_KEY":"key","INNERTUBE_CONTEXT_CLIENT_VERSION":"1.0"`;
    let requests = 0;
    globalThis.fetch = (async () => ++requests % 2 === 1
      ? new Response(html)
      : new Response("limited", { status: 429 })) as unknown as typeof fetch;

    await expect(fetchChannelPlaylists("UC_rate_limit_test", true)).rejects.toThrow("429");
    await expect(fetchChannelPlaylists("UC_rate_limit_test", false)).rejects.toThrow("429");
    expect(requests).toBe(4);
  });

  test("propagates bot challenges and publication-date 429 responses", async () => {
    globalThis.fetch = (async () => new Response("Please confirm you're not a bot")) as unknown as typeof fetch;
    await expect(fetchChannelVideos("UC_bot_challenge_test")).rejects.toThrow("bot challenge");

    globalThis.fetch = (async () => new Response("limited", { status: 429 })) as unknown as typeof fetch;
    await expect(fetchVideoPublishedAt("video-rate-limit-test")).rejects.toThrow("429");
  });
});

describe("YouTube address refusal gate", () => {
  test("backs off adaptively and resets after a real answer", () => {
    let now = 0;
    const events: string[] = [];
    const gate = new YouTubeRefusalGate(() => now, { warn: (event: string) => events.push(event), info: (event: string) => events.push(event) } as any);
    gate.enter();
    expect(gate.refused(new Error("LOGIN_REQUIRED: Sign in to confirm you're not a bot")).retryAt).toBe(90_000);
    expect(() => gate.enter()).toThrow(YouTubeRefusalError);
    now = 90_000;
    gate.enter();
    expect(gate.refused(new Error("429")).retryAt).toBe(270_000);
    now = 270_000;
    gate.enter();
    expect(gate.refused(new Error("429")).retryAt).toBe(630_000);
    gate.answered();
    expect(events).toEqual(["youtube.refusal_started", "youtube.refusal_lifted"]);
  });

  test("recognizes the first aggregate LOGIN_REQUIRED error without treating private videos as refused", () => {
    expect(isYouTubeRefusalError(new Error("video info failed: html=videoDetails missing (LOGIN_REQUIRED: Sign in to confirm you're not a bot)"))).toBe(true);
    expect(isYouTubeRefusalError(new Error("videoDetails missing (LOGIN_REQUIRED: Private video)"))).toBe(false);
  });
});
