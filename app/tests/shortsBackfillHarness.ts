const { db } = await import("../src/db");

let mode: "unknown" | "regular" | "refused" = "unknown";
let fetches = 0;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (url.includes("/shorts/")) fetches++;
  if (mode === "refused") return new Response(null, { status: 429 });
  if (mode === "regular") return new Response(null, { status: 303, headers: { location: "/watch?v=test" } });
  return new Response(null, { status: 500 });
}) as typeof fetch;

const { backfillShorts } = await import("../src/refresher");

db.prepare("INSERT INTO channels(channel_id,title) VALUES('UCshortsRetry','Shorts retry')").run();
const insert = db.prepare(`
  INSERT INTO videos(video_id,channel_id,title,duration,published_at,is_short)
  VALUES(?, 'UCshortsRetry', ?, ?, datetime('now'), NULL)
`);
insert.run("long-video", "Long video", "3:01");
insert.run("unknown-video", "Uncertain video", "0:43");

await backfillShorts(["long-video", "unknown-video"]);
const afterFirst = db.prepare("SELECT is_short,short_check_attempts,short_check_next_attempt_at FROM videos WHERE video_id=?").get("unknown-video");
const fetchesAfterFirst = fetches;
await backfillShorts(["unknown-video"]);
const fetchesBeforeDue = fetches;

db.prepare("UPDATE videos SET short_check_next_attempt_at='2000-01-01 00:00:00' WHERE video_id='unknown-video'").run();
mode = "regular";
await backfillShorts(["unknown-video"]);
const afterResolved = db.prepare("SELECT is_short,short_check_attempts,short_check_next_attempt_at FROM videos WHERE video_id=?").get("unknown-video");
const long = db.prepare("SELECT is_short,short_check_attempts FROM videos WHERE video_id='long-video'").get();

insert.run("concurrent-video", "Concurrent video", "0:43");
mode = "unknown";
const beforeConcurrent = fetches;
await Promise.all([backfillShorts(["concurrent-video"]), backfillShorts(["concurrent-video"])]);
const concurrent = db.prepare("SELECT short_check_attempts FROM videos WHERE video_id='concurrent-video'").get();
const concurrentFetches = fetches - beforeConcurrent;

insert.run("limit-first", "First", "0:43");
insert.run("limit-second", "Second", "0:43");
const beforeLimit = fetches;
await backfillShorts(["limit-first", "limit-second"], 1);
const limited = db.prepare("SELECT video_id,short_check_attempts FROM videos WHERE video_id IN ('limit-first','limit-second') ORDER BY video_id").all();
const limitFetches = fetches - beforeLimit;

insert.run("refused-video", "Refused", "0:43");
mode = "refused";
await backfillShorts(["refused-video"]);
const refused = db.prepare("SELECT short_check_attempts,short_check_attempted_at FROM videos WHERE video_id='refused-video'").get();

console.log("RESULT " + JSON.stringify({
  afterFirst,
  fetchesAfterFirst,
  fetchesBeforeDue,
  afterResolved,
  long,
  concurrent,
  concurrentFetches,
  limited,
  limitFetches,
  refused,
}));
db.close();
