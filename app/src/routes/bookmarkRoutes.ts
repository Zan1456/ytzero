import type { Context, Hono } from "hono";
import { database } from "../database";
import { videoSelect } from "../videoSelect";
import type { VideoRow } from "../videoRoutesSupport";

type ApiEnvironment = { Variables: { userId: number; sessionAdmin?: boolean; profileAdmin?: boolean } };
type Api = Hono<ApiEnvironment>;
type ApiContext = Context<ApiEnvironment>;

const MAX_DESCRIPTION_LENGTH = 2_000;

export function registerBookmarkRoutes(
  api: Api,
  access: {
    currentUserId: (context: ApiContext) => number;
    attachTags: (userId: number, videos: VideoRow[]) => Promise<Array<VideoRow & Record<string, unknown>>>;
  },
): void {
  const { currentUserId, attachTags } = access;

  api.get("/bookmarks", async (c) => {
    const uid = currentUserId(c);
    const rows = await database.prepare(`
      SELECT video.*, b.portable_uuid AS bookmark_id, b.position_seconds,
             b.description AS bookmark_description, b.created_at AS bookmarked_at,
             b.updated_at AS bookmark_updated_at
      FROM (${videoSelect(uid)}) AS video
      JOIN bookmarks b ON b.video_id = video.video_id AND b.user_id = ?
      ORDER BY b.updated_at DESC, b.id DESC
    `).all(uid) as Array<VideoRow & Record<string, unknown>>;
    return c.json({ bookmarks: await attachTags(uid, rows) });
  });

  api.get("/videos/:id/bookmark", async (c) => {
    const row = await database.prepare(`
      SELECT portable_uuid AS id, video_id, position_seconds, description, created_at, updated_at
      FROM bookmarks WHERE user_id = ? AND video_id = ?
    `).get(currentUserId(c), c.req.param("id"));
    return c.json({ bookmark: row ?? null });
  });

  api.put("/videos/:id/bookmark", async (c) => {
    const uid = currentUserId(c);
    const videoId = c.req.param("id");
    const body = await c.req.json().catch(() => null) as Record<string, unknown> | null;
    const position = Number(body?.position_seconds);
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!Number.isFinite(position) || position < 0 || position > 1_000_000_000) {
      return c.json({ error: "invalid position_seconds" }, 400);
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return c.json({ error: "description too long", max_length: MAX_DESCRIPTION_LENGTH }, 400);
    }
    if (!await database.prepare("SELECT 1 FROM videos WHERE video_id = ?").get(videoId)) {
      return c.json({ error: "video not found" }, 404);
    }

    const bookmark = await database.prepare(`
      INSERT INTO bookmarks(portable_uuid, user_id, video_id, position_seconds, description)
      VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(user_id, video_id) DO UPDATE SET
        position_seconds = excluded.position_seconds,
        description = excluded.description,
        updated_at = datetime('now')
      RETURNING portable_uuid AS id, video_id, position_seconds, description, created_at, updated_at
    `).get(crypto.randomUUID(), uid, videoId, Math.round(position * 10) / 10, description);
    return c.json({ bookmark });
  });

  api.delete("/videos/:id/bookmark", async (c) => {
    await database.prepare("DELETE FROM bookmarks WHERE user_id = ? AND video_id = ?")
      .run(currentUserId(c), c.req.param("id"));
    return c.json({ ok: true });
  });
}
