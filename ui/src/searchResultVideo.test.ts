import { describe, expect, test } from "bun:test";
import { searchResultVideo } from "./searchResultVideo";
import type { SearchResult } from "./apiTypes";

const result: SearchResult = {
  videoId: "abc123DEF45", title: "Result", thumbnail: "thumb", duration: "4:20",
  channelId: "UC123", channelTitle: "Channel", channelAvatar: "avatar", viewCount: 42,
  published: { value: 2, unit: "year" }, watched: 0, watch_position: null, watch_duration: null,
  bucket: null, download_status: "done", downloads_enabled: true, downloads_allowed: true,
};

describe("searchResultVideo", () => {
  test("maps external results to a ready, approximate video card", () => {
    const video = searchResultVideo(result, new Date("2026-08-25T12:00:00.000Z"));
    expect(video.channel_id).toBe("UC123");
    expect(video.published_at).toBe("2024-08-25T12:00:00.000Z");
    expect(video.published_at_approximate).toBe(1);
    expect(video.download_status).toBe("done");
  });

  test("keeps unknown publication dates out of the processing state", () => {
    const video = searchResultVideo({ ...result, published: null });
    expect(video.published_at).toBe(null);
    expect(video.published_at_approximate).toBe(0);
  });
});
