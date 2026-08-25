import type { PlayerKind } from "./watchPlayerMode";
import { api } from "../api";

const AUDIO_PLAYER_KINDS = new Set<PlayerKind>(["stream", "local", "direct", "waiting", "choice", "youtube"]);

export interface WatchAudioSources {
  playlistSrc?: string;
  progressiveSrc?: string;
  retryRemoteSource: boolean;
}

/** Prefer an already authorized local file over resolving another YouTube source. */
export function resolveWatchAudioSources({
  videoId,
  liveStatus,
  downloadStatus,
  localMediaSource,
}: {
  videoId: string;
  liveStatus: string;
  downloadStatus: string | null | undefined;
  localMediaSource?: "download" | "tubearchivist" | null;
}): WatchAudioSources {
  if (liveStatus === "live") {
    return { playlistSrc: api.liveAudioUrl(videoId), retryRemoteSource: true };
  }
  if (downloadStatus === "done" || localMediaSource === "download") {
    return { progressiveSrc: api.streamUrl(videoId), retryRemoteSource: false };
  }
  return {
    playlistSrc: api.audioHlsUrl(videoId),
    progressiveSrc: api.audioUrl(videoId),
    retryRemoteSource: true,
  };
}

export function canUseWatchAudioMode({
  childProfile,
  hasVideo,
  liveStatus,
  membersOnly,
  playerKind,
  privateVideo,
  watchTogetherRoomId,
}: {
  childProfile: boolean;
  hasVideo: boolean;
  liveStatus: string;
  membersOnly: boolean;
  playerKind: PlayerKind;
  privateVideo: boolean;
  watchTogetherRoomId: string | null;
}): boolean {
  return hasVideo
    && !childProfile
    && liveStatus !== "upcoming"
    && !membersOnly
    && !privateVideo
    && !watchTogetherRoomId
    && AUDIO_PLAYER_KINDS.has(playerKind);
}

export function resolveWatchStartSeconds(...candidates: Array<number | null | undefined>): number {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) return Math.floor(candidate);
  }
  return 0;
}

export function resolveWatchPlaybackStart({
  capturedPosition,
  savedPosition,
  sharedTargetChanged,
  sharedTargetSeconds,
}: {
  capturedPosition: number;
  savedPosition: number;
  sharedTargetChanged: boolean;
  sharedTargetSeconds: number;
}): number {
  return sharedTargetChanged
    ? resolveWatchStartSeconds(sharedTargetSeconds, capturedPosition, savedPosition)
    : resolveWatchStartSeconds(capturedPosition, sharedTargetSeconds, savedPosition);
}

export function ownedWatchPosition(
  currentVideoId: string | undefined,
  positionVideoId: string | null,
  position: number | null | undefined,
): number {
  return currentVideoId && currentVideoId === positionVideoId && typeof position === "number" ? position : 0;
}
