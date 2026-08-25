const { api } = await import("../src/routes");
const { db } = await import("../src/db");

db.prepare("INSERT INTO channels(channel_id,title,url) VALUES('UCbookmark','Bookmark channel','https://youtube.com/channel/UCbookmark')").run();
db.prepare("INSERT INTO videos(video_id,channel_id,title,description,thumbnail) VALUES('bookmark001','UCbookmark','Bookmark video','Description','thumb.jpg')").run();
const secondary = db.prepare("INSERT INTO users(name,avatar_color,sort_order,portable_uuid) VALUES('Secondary','#123456',1,?) RETURNING id")
  .get(crypto.randomUUID()) as { id: number };
const tag = db.prepare("INSERT INTO tags(name,color,user_id,portable_uuid) VALUES('Research','#3366ff',1,?) RETURNING id")
  .get(crypto.randomUUID()) as { id: number };
db.prepare("INSERT INTO channel_tags(channel_id,tag_id) VALUES('UCbookmark',?)").run(tag.id);

const request = (profileId: number, path: string, method = "GET", body?: unknown) => api.request(`http://localhost${path}`, {
  method,
  headers: { Cookie: `ytzero_profile=${profileId}`, "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const firstResponse = await request(1, "/videos/bookmark001/bookmark", "PUT", { position_seconds: 12.34, description: "First note" });
const first = await firstResponse.json() as any;
const secondaryBefore = await (await request(secondary.id, "/videos/bookmark001/bookmark")).json() as any;
const updateResponse = await request(1, "/videos/bookmark001/bookmark", "PUT", { position_seconds: 45, description: "Updated note" });
const updated = await updateResponse.json() as any;
await request(secondary.id, "/videos/bookmark001/bookmark", "PUT", { position_seconds: 99, description: "Other profile" });
const listResponse = await request(1, "/bookmarks");
const list = await listResponse.json() as any;
const invalidResponse = await request(1, "/videos/bookmark001/bookmark", "PUT", { position_seconds: -1, description: "No" });
const missingResponse = await request(1, "/videos/missing/bookmark", "PUT", { position_seconds: 1, description: "No" });
const deleteResponse = await request(1, "/videos/bookmark001/bookmark", "DELETE");

console.log("RESULT " + JSON.stringify({
  firstStatus: firstResponse.status,
  updateStatus: updateResponse.status,
  stableId: first.bookmark.id !== updated.bookmark.id,
  roundedPosition: first.bookmark.position_seconds,
  secondaryBefore: secondaryBefore.bookmark,
  listStatus: listResponse.status,
  listCount: list.bookmarks.length,
  listDescription: list.bookmarks.find((item: any) => item.bookmark_description === "Updated note")?.bookmark_description,
  channelTagSource: list.bookmarks[0]?.tags?.[0]?.source,
  invalidStatus: invalidResponse.status,
  missingStatus: missingResponse.status,
  deleteStatus: deleteResponse.status,
  primaryRemaining: (db.prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE user_id=1").get() as { n: number }).n,
  secondaryRemaining: (db.prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE user_id=?").get(secondary.id) as { n: number }).n,
}));

db.close();
