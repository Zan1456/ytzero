import type { PlaybackQueueContext } from "./playbackQueue";

function isExplicitPlaylist(queue: PlaybackQueueContext | null) {
  return queue?.kind === "user-playlist" || queue?.kind === "channel-playlist";
}

export function effectivePlaybackQueue({ currentVideoId, routeQueue, storedQueue, sessionQueue, watchTogether }: {
  currentVideoId: string | undefined;
  routeQueue: PlaybackQueueContext | null;
  storedQueue: PlaybackQueueContext | null | undefined;
  sessionQueue: Extract<PlaybackQueueContext, { kind: "session" }> | null;
  watchTogether: boolean;
}): PlaybackQueueContext | null {
  const base = routeQueue?.kind === "session" ? null : routeQueue ?? storedQueue ?? null;
  if (watchTogether || isExplicitPlaylist(base) || !sessionQueue || !currentVideoId) return base;
  return { ...sessionQueue, ids: sessionQueue.ids.includes(currentVideoId) ? sessionQueue.ids : [currentVideoId, ...sessionQueue.ids] };
}
