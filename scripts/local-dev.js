import { createServer as createHttpServer } from "node:http";
import { Buffer } from "node:buffer";
import process from "node:process";
import { createServer as createViteServer, loadEnv } from "vite";

for (const [key, value] of Object.entries(loadEnv("development", process.cwd(), ""))) {
  if (process.env[key] === undefined) process.env[key] = value;
}

const httpServer = createHttpServer();
const vite = await createViteServer({
  server: {
    middlewareMode: true,
    hmr: { server: httpServer },
  },
});

const apiRoutes = [
  { pattern: /^\/api\/auth$/, module: "/api/auth.js" },
  { pattern: /^\/api\/leads$/, module: "/api/leads.js" },
  { pattern: /^\/api\/leads\/([^/]+)$/, module: "/api/leads/[id].js", param: "id" },
  { pattern: /^\/api\/ai-summary$/, module: "/api/ai-summary.js" },
];

async function readRequestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

httpServer.on("request", async (req, res) => {
  const requestUrl = new URL(req.url || "/", "http://localhost");
  if (requestUrl.pathname.startsWith("/api/")) {
    const route = apiRoutes.map((candidate) => ({ candidate, match: requestUrl.pathname.match(candidate.pattern) }))
      .find((entry) => entry.match);
    if (!route) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "API route not found." }));
      return;
    }

    try {
      req.query = Object.fromEntries(requestUrl.searchParams.entries());
      if (route.candidate.param) req.query[route.candidate.param] = decodeURIComponent(route.match[1]);
      if (["POST", "PATCH", "PUT"].includes(req.method || "")) req.body = await readRequestBody(req);
      const { default: handler } = await vite.ssrLoadModule(route.candidate.module);
      await handler(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = error?.message === "Request body is too large." ? 413 : 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      if (!res.writableEnded) res.end(JSON.stringify({ error: error?.message || "Local API error." }));
      console.error("Local API error:", error);
    }
    return;
  }

  vite.middlewares(req, res, (error) => {
    if (error) {
      vite.ssrFixStacktrace(error);
      if (!res.headersSent) res.statusCode = 500;
      if (!res.writableEnded) res.end("Local development server error.");
      console.error(error);
    }
  });
});

const port = Number(process.env.PORT || 3000);
httpServer.on("error", (error) => {
  console.error(`Could not start the local server on port ${port}:`, error.message);
  void vite.close();
  process.exitCode = 1;
});

httpServer.listen(port, "127.0.0.1", () => {
  console.log(`Local app ready at http://localhost:${port}`);
});

async function shutdown() {
  httpServer.close();
  await vite.close();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
