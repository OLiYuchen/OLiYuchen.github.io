#!/usr/bin/env python3
"""Static preview server for this repo that refuses to be cached.

python3 -m http.server lets the browser hold on to CSS and JS, which during a
design pass means looking at yesterday's page and not knowing it. Everything
here is served with no-store, so a plain refresh is always the real file.
"""
import http.server
import os
import socketserver
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        """Answer byte ranges, as a real host does.

        Without them a browser cannot seek in a video: asked for a range, this
        server used to send the whole file from the start, so the intro film
        on the Paira page could not jump to the line that was clicked.
        """
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not rng.startswith("bytes=") or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        first, _, last = rng[6:].split(",")[0].partition("-")
        try:
            if first:
                start = int(first)
                end = min(int(last), size - 1) if last else size - 1
            else:
                start, end = max(0, size - int(last)), size - 1
        except ValueError:
            return super().send_head()
        if start > end or start >= size:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self._range_left = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, "_range_left", None)
        if left is None:
            return super().copyfile(source, outputfile)
        self._range_left = None
        while left > 0:
            chunk = source.read(min(65536, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            sys.stderr.write("404  %s\n" % (fmt % args))


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """One thread per request.

    The single-threaded server this used to be served one file at a time, so a
    page asking for a dozen images at once would have some of those requests
    time out and the figures would simply not appear. With no-store in force
    every reload refetches all of them, which made it worse, not better.
    """
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    with Server(("127.0.0.1", port), NoCache) as httpd:
        print("preview (no-store, threaded) on http://127.0.0.1:%d" % port, flush=True)
        httpd.serve_forever()
