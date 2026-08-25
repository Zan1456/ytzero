import { describe, expect, test } from "bun:test";
import { effectivePlaybackQueue } from "./sessionPlayQueuePlayback";

const session = { version: 1 as const, kind: "session" as const, ids: ["first000001", "second00002"] };
describe("session play queue priority", () => {
  test("heads an unrelated current video without rotating a queued one", () => {
    expect(effectivePlaybackQueue({ currentVideoId: "current00001", routeQueue: null, storedQueue: null, sessionQueue: session, watchTogether: false }))
      .toEqual({ ...session, ids: ["current00001", ...session.ids] });
    expect(effectivePlaybackQueue({ currentVideoId: "second00002", routeQueue: null, storedQueue: null, sessionQueue: session, watchTogether: false }))
      .toEqual(session);
  });
  test("does not override an explicitly chosen playlist or room", () => {
    const playlist = { version: 1 as const, kind: "user-playlist" as const, playlistUuid: "playlist", sort: "added-newest" as const };
    expect(effectivePlaybackQueue({ currentVideoId: "current00001", routeQueue: playlist, storedQueue: null, sessionQueue: session, watchTogether: false })).toEqual(playlist);
    expect(effectivePlaybackQueue({ currentVideoId: "current00001", routeQueue: null, storedQueue: null, sessionQueue: session, watchTogether: true })).toBe(null);
  });
});
