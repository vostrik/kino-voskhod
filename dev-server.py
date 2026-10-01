"""Локальный сервер для проверки сайта: длинный кеш + gzip для текстовых файлов.

Запуск:  python dev-server.py  →  http://localhost:8000
Это имитирует продакшен-хостинг с Cache-Control: max-age=31536000, immutable
(GitHub Pages такие заголовки задавать не позволяет).
"""

import gzip
import io
import os
import ssl
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

TEXT_EXT = (".html", ".css", ".js", ".svg", ".json")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".woff2"):
            return "font/woff2"
        if path.endswith(".webp"):
            return "image/webp"
        return super().guess_type(path)

    def send_head(self):
        accept_gzip = "gzip" in self.headers.get("Accept-Encoding", "")
        path = self.translate_path(self.path)
        # корень сайта — это index.html, учитываем это до проверки расширения
        if os.path.isdir(path):
            index = os.path.join(path, "index.html")
            if os.path.exists(index):
                path = index
        if accept_gzip and os.path.isfile(path) and path.lower().endswith(TEXT_EXT):
            with open(path, "rb") as f:
                data = gzip.compress(f.read(), 6)
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            return io.BytesIO(data)
        return super().send_head()


if __name__ == "__main__":
    servers = []

    http_server = ThreadingHTTPServer(("", 8000), Handler)
    servers.append(http_server)
    print("HTTP:  http://localhost:8000")

    # HTTPS нужен, чтобы локальный антивирус не внедрял свой скрипт
    # в HTTP-ответы (портит замеры Lighthouse на этой машине)
    cert = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dev-cert.pem")
    key = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dev-key.pem")
    if os.path.exists(cert) and os.path.exists(key):
        https_server = ThreadingHTTPServer(("", 8443), Handler)
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(cert, key)
        https_server.socket = ctx.wrap_socket(https_server.socket, server_side=True)
        servers.append(https_server)
        print("HTTPS: https://localhost:8443 (самоподписанный сертификат)")

    import threading
    threads = [threading.Thread(target=s.serve_forever, daemon=True) for s in servers]
    for t in threads:
        t.start()
    print("Сервер запущен")
    threading.Event().wait()  # работать до Ctrl+C
