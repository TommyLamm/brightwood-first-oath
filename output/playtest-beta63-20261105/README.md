# Active Tailscale playtest

User requested remote play over Tailscale on 2026-11-05, Asia/Hong_Kong.
Existing beta.63 `dist/` is served without rebuild or source changes.

- Browser URL: http://100.64.75.45:43769/
- Backend: hidden background Python http.server, bound to 100.64.75.45:43769.
- Process ownership is recorded in `server-owner.json`; stdout/stderr stay here.
- The earlier loopback server (exec99839) was normally stopped.
- A Tailscale Serve HTTP proxy was tried, but local requests did not return the
  game; that endpoint was removed. Direct binding now supplies the IPv4 URL above.
- The server is intentionally left running for remote play over the tailnet.

To stop this playtest on request, inspect current ownership/status first and
stop only the matching background server. Do not reset Serve configuration or
stop unrelated servers. Historical PIDs/session identifiers are evidence, not
permission to terminate an unverified process in a later chat.
