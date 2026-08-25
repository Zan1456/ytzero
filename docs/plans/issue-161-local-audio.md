# #161 — lokalne źródło w trybie audio

Audio mode now prefers a completed local download over the yt-dlp audio proxy.
`WatchPage` selects `/api/videos/:id/stream` as its only progressive source
when the active profile owns a download with status `done`. The audio media
hook recognizes a progressive-only source and attaches it directly, without
loading native HLS or `hls.js`.

Remote VOD retains its HLS playlist and progressive fallback; live audio keeps
its existing HLS path. A local retry reloads `/stream` without calling
`/audio/retry`, so retrying a local file cannot trigger yt-dlp or contact
YouTube.

The regression tests cover completed, incomplete, remote VOD, and live source
selection. No persistent state, database schema, backup format, or backend
route was changed.
