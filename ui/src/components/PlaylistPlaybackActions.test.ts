import { afterEach, expect, test } from "bun:test";
import type { Video } from "../api";
import { profileAudioModeEnabled, rememberProfileAudioMode } from "../audioModePreference";
import { forgetRememberedProfile, rememberProfile } from "../profilePreference";
import { playPlaylistVideo } from "./PlaylistPlaybackActions";

const values = new Map<string, string>();
const originalStorage = globalThis.localStorage;
const fakeStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
};

function installFakeStorage() {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: fakeStorage });
}

afterEach(() => {
  values.clear();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalStorage });
});

test("sets the active profile's mode before starting the selected playlist video", () => {
  installFakeStorage();
  rememberProfile(7);
  rememberProfileAudioMode(8, true);
  const first = { video_id: "first" } as Video;
  const continuation = { video_id: "continuation" } as Video;
  const observed: Array<{ video: Video; audio: boolean }> = [];
  const onPlay = (video: Video) => observed.push({ video, audio: profileAudioModeEnabled(7) });

  playPlaylistVideo(first, true, onPlay);
  playPlaylistVideo(continuation, false, onPlay);

  expect(observed).toEqual([
    { video: first, audio: true },
    { video: continuation, audio: false },
  ]);
  expect(profileAudioModeEnabled(8)).toBe(true);
  forgetRememberedProfile();
});
