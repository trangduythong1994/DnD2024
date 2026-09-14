import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
http
  .createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      ).replace(/^\/DnD2024\//, "/");
      if (pathname.endsWith("/")) pathname += "index.html";
      const file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep)) throw Error();
      const data = await readFile(file);
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".svg": "image/svg+xml",
          ".json": "application/json",
        }[path.extname(file)] || "text/plain",
      );
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("http://127.0.0.1:4173/DnD2024/"),
  );
