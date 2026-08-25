import { useSyncExternalStore } from "react";
import type { Video } from "./api";
import { SESSION_PLAY_QUEUE_MAX_ITEMS, type PlaybackQueueContext } from "./playbackQueue";

const STORAGE_KEY = "ytzero.session-play-queue.v1";
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
const listeners = new Set<() => void>();

export type SessionPlayQueueItem = Pick<Video, "video_id" | "title" | "thumbnail" | "channel_title">;
type StoredQueue = { version: 1; items: SessionPlayQueueItem[] };

function storage(): Storage | null { try { return globalThis.sessionStorage ?? null; } catch { return null; } }
function cleanText(value: unknown, max: number) { return typeof value === "string" ? value.slice(0, max) : ""; }
function parse(value: unknown): SessionPlayQueueItem[] {
  if (!value || typeof value !== "object") return [];
  const raw = value as { version?: unknown; items?: unknown };
  if (raw.version !== 1 || !Array.isArray(raw.items)) return [];
  const seen = new Set<string>();
  const items: SessionPlayQueueItem[] = [];
  for (const candidate of raw.items) {
    if (!candidate || typeof candidate !== "object" || items.length >= SESSION_PLAY_QUEUE_MAX_ITEMS) continue;
    const item = candidate as Record<string, unknown>;
    const video_id = cleanText(item.video_id, 20);
    if (!VIDEO_ID.test(video_id) || seen.has(video_id)) continue;
    seen.add(video_id);
    items.push({ video_id, title: cleanText(item.title, 500), thumbnail: cleanText(item.thumbnail, 2048), channel_title: cleanText(item.channel_title, 300) });
  }
  return items;
}
function read() { const raw = storage()?.getItem(STORAGE_KEY); try { return parse(raw ? JSON.parse(raw) : null); } catch { return []; } }
let snapshot = read();
function notify() { for (const listener of listeners) listener(); }
function write(items: SessionPlayQueueItem[]) {
  snapshot = items;
  try {
    const target = storage();
    if (target) target.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items } satisfies StoredQueue));
  } catch { /* Session storage is a convenience, not a dependency. */ }
  notify();
}

export function sessionPlayQueueItems() { return snapshot; }
export function sessionPlayQueueContext(items = snapshot): Extract<PlaybackQueueContext, { kind: "session" }> | null {
  return items.length ? { version: 1, kind: "session", ids: items.map((item) => item.video_id) } : null;
}
export function addToSessionPlayQueue(video: SessionPlayQueueItem) {
  if (!VIDEO_ID.test(video.video_id) || snapshot.some((item) => item.video_id === video.video_id) || snapshot.length >= SESSION_PLAY_QUEUE_MAX_ITEMS) return false;
  write([...snapshot, { video_id: video.video_id, title: cleanText(video.title, 500), thumbnail: cleanText(video.thumbnail, 2048), channel_title: cleanText(video.channel_title, 300) }]);
  return true;
}
export function removeFromSessionPlayQueue(videoId: string) { write(snapshot.filter((item) => item.video_id !== videoId)); }
export function clearSessionPlayQueue() { write([]); }
export function subscribeSessionPlayQueue(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
export function useSessionPlayQueue() { return useSyncExternalStore(subscribeSessionPlayQueue, sessionPlayQueueItems, () => []); }
