# #158 — direct stream player

Implement a per-profile default player setting (`youtube` or `direct`). The
direct option resolves a progressive H.264/AAC MP4 through yt-dlp and proxies
bounded byte ranges without creating a download, queue entry, ffmpeg segment,
or disk file. The YouTube player falls back to it once for errors 100, 101 and
150. A completed local download still wins, and native/direct/local playback
shares one React key so iOS retains user activation during handoff.

The implementation includes a portable `default_player` preference, a
bounded/validated Google Video range proxy with explicit `Content-Length`,
player-mode tests, direct-stream proxy tests, backup compatibility tests, and
documentation updates. Experimental HLS streaming remains the separate mode
that deliberately downloads in the background.
