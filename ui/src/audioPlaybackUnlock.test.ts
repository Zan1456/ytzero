import { describe, expect, test } from "bun:test";
import { installInitialAudioPlaybackUnlock } from "./audioPlaybackUnlock";

type Listener = (event: Event) => void;

class FakeEventTarget {
  private listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: Listener): void {
    const listeners = this.listeners.get(type) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, target: EventTarget | null = null): void {
    for (const listener of this.listeners.get(type) ?? []) listener({ target } as Event);
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class FakeAudio extends FakeEventTarget {
  playCalls = 0;
  rejectPlay = false;

  play(): Promise<void> {
    this.playCalls += 1;
    return this.rejectPlay ? Promise.reject(new Error("blocked")) : Promise.resolve();
  }
}

describe("initial audio playback unlock", () => {
  test("retries playback on each page gesture while autoplay is blocked", async () => {
    const audio = new FakeAudio();
    const page = new FakeEventTarget();
    audio.rejectPlay = true;
    installInitialAudioPlaybackUnlock({ audio, eventTarget: page, hasPlayed: () => false });

    page.dispatch("pointerdown");
    page.dispatch("pointerdown");
    await Promise.resolve();

    expect(audio.playCalls).toBe(2);
  });

  test("stops permanently once playback has started, including after a later pause", () => {
    const audio = new FakeAudio();
    const page = new FakeEventTarget();
    let hasPlayed = false;
    installInitialAudioPlaybackUnlock({ audio, eventTarget: page, hasPlayed: () => hasPlayed });

    page.dispatch("pointerdown");
    hasPlayed = true;
    audio.dispatch("play");
    page.dispatch("pointerdown");

    expect(audio.playCalls).toBe(1);
    expect(page.listenerCount("pointerdown")).toBe(0);
  });

  test("leaves the dedicated play control to its own click handler", () => {
    const audio = new FakeAudio();
    const page = new FakeEventTarget();
    const playButton = {} as EventTarget;
    installInitialAudioPlaybackUnlock({
      audio,
      eventTarget: page,
      hasPlayed: () => false,
      isExcludedTarget: (target) => target === playButton,
    });

    page.dispatch("pointerdown", playButton);

    expect(audio.playCalls).toBe(0);
  });

  test("removes both listeners during cleanup", () => {
    const audio = new FakeAudio();
    const page = new FakeEventTarget();
    const cleanup = installInitialAudioPlaybackUnlock({ audio, eventTarget: page, hasPlayed: () => false });

    cleanup();
    page.dispatch("pointerdown");

    expect(audio.playCalls).toBe(0);
    expect(page.listenerCount("pointerdown")).toBe(0);
    expect(audio.listenerCount("play")).toBe(0);
  });
});
