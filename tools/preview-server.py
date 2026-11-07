#!/usr/bin/env python3
"""Static preview server for this repo that refuses to be cached.

python3 -m http.server lets the browser hold on to CSS and JS, which during a
design pass means looking at yesterday's page and not knowing it. Everything
here is served with no-store, so a plain refresh is always the real file.
"""
import http.server
import socketserver
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            sys.stderr.write("404  %s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), NoCache) as httpd:
        print("preview (no-store) on http://127.0.0.1:%d" % port, flush=True)
        httpd.serve_forever()
