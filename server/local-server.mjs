import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateNewsJson } from "../scripts/generate-news-json.mjs";
import { generateTrafficJsonFromEnv } from "../scripts/generate-traffic-json.mjs";

// LAN-only feeds. NHK headlines must not be committed or deployed to GitHub Pages
// (redistribution is not clearly licensed), so the generated output lives in
// server/generated/ which is gitignored.
const DEFAULT_LOCAL_NEWS_FEEDS = [
  {
    id: "nhk-top",
    name: "NHKニュース",
    category: "主要",
    url: "https://www3.nhk.or.jp/rss/news/cat0.xml",
  },
  {
    id: "nhk-keizai",
    name: "NHKニュース",
    category: "経済",
    url: "https://www3.nhk.or.jp/rss/news/cat5.xml",
  },
];

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(repoRoot, "dist");
const generatedDataDir = resolve(repoRoot, "server", "generated", "data");

const config = {
  host: process.env.LOCAL_SERVER_HOST ?? "0.0.0.0",
  newsRefreshMinutes: parsePositiveInteger(process.env.NEWS_REFRESH_MINUTES, 30),
  port: parsePositiveInteger(process.env.LOCAL_SERVER_PORT, 8080),
  trafficRefreshMinutes: parsePositiveInteger(process.env.TRAFFIC_REFRESH_MINUTES, 5),
};

const jobStates = new Map();

const jobs = [
  {
    intervalMinutes: config.newsRefreshMinutes,
    name: "news",
    run: () =>
      generateNewsJson({
        feeds: parseFeedsEnv(process.env.NEWS_FEEDS_JSON) ?? DEFAULT_LOCAL_NEWS_FEEDS,
        maxItems: parsePositiveInteger(process.env.NEWS_MAX_ITEMS, 5),
        outputPath: resolve(generatedDataDir, "news.json"),
        timeoutMs: parsePositiveInteger(process.env.NEWS_TIMEOUT_MS, 15000),
      }),
  },
  {
    // Placeholder source: regenerates from data-sources/traffic.manual.json until the
    // ODPT fetcher lands. Swap `run` to the ODPT-backed generator; keep everything else.
    intervalMinutes: config.trafficRefreshMinutes,
    name: "traffic",
    run: () =>
      generateTrafficJsonFromEnv({
        ...process.env,
        TRAFFIC_OUTPUT_PATH: resolve(generatedDataDir, "traffic.json"),
      }),
  },
];

for (const job of jobs) {
  jobStates.set(job.name, { lastError: null, lastErrorAt: null, lastSuccessAt: null });
  void runJob(job);
  setInterval(() => void runJob(job), job.intervalMinutes * 60 * 1000);
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    console.error("[local-server] unhandled request error:", error instanceof Error ? error.message : error);
    if (!response.headersSent) {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    }
    response.end(JSON.stringify({ error: { code: "NETWORK_ERROR", message: "Internal server error", retryable: true } }));
  });
});

server.listen(config.port, config.host, () => {
  console.log(`[local-server] serving ${distDir}`);
  console.log(`[local-server] generated data overlay: ${generatedDataDir}`);
  console.log(`[local-server] listening on http://${config.host}:${config.port}/ (LAN URL: http://<this-pc-ip>:${config.port}/)`);
});

void warnIfDistMissing();

async function handleRequest(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD", "content-type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  if (pathname.includes("..") || pathname.includes("\0")) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bad Request");
    return;
  }

  if (pathname === "/healthz") {
    sendJson(response, request.method, 200, {
      jobs: Object.fromEntries(jobStates),
      status: "ok",
    });
    return;
  }

  for (const filePath of candidateFilePaths(pathname)) {
    const body = await readFile(filePath).catch(() => undefined);
    if (body === undefined) {
      continue;
    }

    const headers = {
      "content-type": MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "cache-control": cacheControlFor(pathname),
    };
    response.writeHead(200, headers);
    response.end(request.method === "HEAD" ? undefined : body);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not Found");
}

function candidateFilePaths(pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidates = [];

  // Generated JSON shadows the copy bundled into dist/ so widgets get fresh data
  // from the same /data/... URLs the static build already uses.
  if (pathname.startsWith("/data/")) {
    candidates.push(resolve(generatedDataDir, pathname.slice("/data/".length)));
  }

  candidates.push(resolve(distDir, relativePath));

  // SPA fallback for extension-less paths.
  if (extname(relativePath) === "") {
    candidates.push(resolve(distDir, "index.html"));
  }

  return candidates.filter((candidate) => candidate.startsWith(distDir) || candidate.startsWith(generatedDataDir));
}

function cacheControlFor(pathname) {
  if (pathname.startsWith("/data/") || pathname.endsWith("manifest.json") || pathname.endsWith(".html") || pathname === "/") {
    return "no-store";
  }

  return "public, max-age=300";
}

function sendJson(response, method, status, payload) {
  response.writeHead(status, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  response.end(method === "HEAD" ? undefined : JSON.stringify(payload, null, 2));
}

async function runJob(job) {
  const state = jobStates.get(job.name);
  try {
    await job.run();
    state.lastSuccessAt = new Date().toISOString();
    state.lastError = null;
    state.lastErrorAt = null;
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : String(error);
    state.lastErrorAt = new Date().toISOString();
    console.warn(`[local-server] ${job.name} generation failed: ${state.lastError}`);
  }
}

async function warnIfDistMissing() {
  const indexBody = await readFile(resolve(distDir, "index.html")).catch(() => undefined);
  if (indexBody === undefined) {
    console.warn("[local-server] dist/index.html not found. Run `npm run build` first.");
  }
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFeedsEnv(value) {
  if (!value) {
    return undefined;
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("NEWS_FEEDS_JSON must be an array");
  }

  return parsed;
}
