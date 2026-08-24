type PlaybackElement = Pick<HTMLMediaElement, "addEventListener" | "play" | "removeEventListener">;

type PointerEventTarget = Pick<Document, "addEventListener" | "removeEventListener">;

/**
 * Give a newly mounted audio element one more chance to start from the next
 * page gesture. iOS does not carry media activation across navigation, but it
 * does allow play() when it is called synchronously from this page's gesture.
 */
export function installInitialAudioPlaybackUnlock({
  audio,
  eventTarget,
  hasPlayed,
  isExcludedTarget = () => false,
}: {
  audio: PlaybackElement;
  eventTarget: PointerEventTarget;
  hasPlayed: () => boolean;
  isExcludedTarget?: (target: EventTarget | null) => boolean;
}): () => void {
  if (hasPlayed()) return () => {};

  let active = true;
  const stop = () => {
    if (!active) return;
    active = false;
    eventTarget.removeEventListener("pointerdown", onPointerDown, true);
    audio.removeEventListener("play", stop);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!active || hasPlayed() || isExcludedTarget(event.target)) return;
    void audio.play().catch(() => {});
  };

  audio.addEventListener("play", stop);
  eventTarget.addEventListener("pointerdown", onPointerDown, true);
  return stop;
}
