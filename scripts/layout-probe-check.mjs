import { createServer } from "vite";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const viewports = [
  { label: "plan target", width: 1524, height: 1016 },
  { label: "kiosk measured", width: 1524, height: 1015 },
];
const appPort = 4175;
const debugPort = 9333;
const baseUrl = `http://127.0.0.1:${appPort}`;

const checks = [
  {
    name: "weather detail",
    openSelector: ".widget-weather .widget-detail-touch-target",
    rules: [
      { selector: ".widget-detail-root.weather-detail-root" },
      { selector: ".widget-detail-primary.weather-detail-top" },
      { selector: ".widget-detail-secondary.weather-detail-daily-stack" },
      { selector: ".weather-detail-now" },
      { selector: ".weather-detail-daily" },
      { selector: ".weather-detail-note" },
      { allowHorizontalOverflow: true, selector: ".widget-scroll-region.weather-detail-hourly" },
    ],
  },
  {
    name: "traffic detail",
    openSelector: ".widget-traffic .widget-detail-touch-target",
    rules: [
      { selector: ".widget-detail-root.traffic-detail-root" },
      { selector: ".widget-detail-secondary.traffic-detail-summary" },
      { selector: ".widget-detail-primary.traffic-detail-impact" },
      { selector: ".widget-detail-list.traffic-detail-lines" },
    ],
  },
  {
    name: "pet photo detail",
    openSelector: ".widget-petPhoto .widget-detail-touch-target",
    rules: [
      { selector: ".widget-detail-root.petPhoto-detail-root" },
      { selector: ".widget-detail-primary.petPhoto-detail-media" },
    ],
  },
];

function findBrowserExecutable() {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
          ]
        : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Chrome, Edge, or Chromium executable was not found for layout probe checks.");
  }
  return found;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }
  return response.json();
}

async function waitForDebugPort() {
  const deadline = Date.now() + 10000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      return await requestJson(`http://127.0.0.1:${debugPort}/json/version`);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw lastError ?? new Error("Timed out waiting for browser debug port.");
}

async function waitForProcessExit(process) {
  if (!process || process.exitCode !== null || process.signalCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    process.once("exit", resolve);
  });
}

async function removeTempDir(path) {
  const deadline = Date.now() + 5000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      await rm(path, { force: true, recursive: true });
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw lastError ?? new Error(`Timed out removing ${path}`);
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const callbacks = new Map();
  const events = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && callbacks.has(message.id)) {
      const { reject, resolve } = callbacks.get(message.id);
      callbacks.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
      return;
    }

    const listeners = events.get(message.method);
    if (listeners) {
      for (const listener of listeners) {
        listener(message.params);
      }
    }
  });

  return {
    async ready() {
      if (socket.readyState === WebSocket.OPEN) {
        return;
      }
      await new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener("error", reject, { once: true });
      });
    },
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        callbacks.set(id, { reject, resolve });
      });
    },
    once(method) {
      return new Promise((resolve) => {
        const listener = (params) => {
          const listeners = events.get(method) ?? [];
          events.set(
            method,
            listeners.filter((candidate) => candidate !== listener),
          );
          resolve(params);
        };
        events.set(method, [...(events.get(method) ?? []), listener]);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function openProbePage(viewport) {
  await waitForDebugPort();
  const target = await requestJson(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(baseUrl)}`, { method: "PUT" });
  const client = createCdpClient(target.webSocketDebuggerUrl);
  await client.ready();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: viewport.height,
    mobile: false,
    width: viewport.width,
  });
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url: baseUrl });
  await loaded;
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result.value;
}

async function waitForSelector(client, selector) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const exists = await evaluate(client, `Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    if (exists) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for selector: ${selector}`);
}

async function assertViewportMetrics(client, viewport) {
  const metrics = await evaluate(
    client,
    `({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      documentClientWidth: document.documentElement.clientWidth,
      documentClientHeight: document.documentElement.clientHeight,
      aspectRatio: window.innerWidth / window.innerHeight
    })`,
  );

  if (
    metrics.innerWidth !== viewport.width ||
    metrics.innerHeight !== viewport.height ||
    metrics.documentClientWidth !== viewport.width ||
    metrics.documentClientHeight !== viewport.height
  ) {
    throw new Error(
      `${viewport.label} viewport mismatch: expected ${viewport.width}x${viewport.height}, got inner=${metrics.innerWidth}x${metrics.innerHeight} document=${metrics.documentClientWidth}x${metrics.documentClientHeight}`,
    );
  }
}

async function runCheck(client, check, viewport) {
  await evaluate(client, "document.querySelector('.home-command')?.click()");
  await waitForSelector(client, check.openSelector);
  await evaluate(client, `document.querySelector(${JSON.stringify(check.openSelector)})?.click()`);
  await waitForSelector(client, check.rules[0].selector);
  await new Promise((resolve) => setTimeout(resolve, 150));

  const results = await evaluate(
    client,
    `(() => {
      const rules = ${JSON.stringify(check.rules)};
      const probe = window.__layoutProbe;
      if (!probe) {
        throw new Error("window.__layoutProbe is not available");
      }
      const results = probe.collect(rules);
      return { results, failed: probe.getFailed(results) };
    })()`,
  );

  if (results.failed.length > 0) {
    const details = results.failed
      .map((failure) => `${failure.selector} missing=${failure.missing} vertical=${failure.verticalOverflow} horizontal=${failure.horizontalOverflow} size=${failure.clientWidth}x${failure.clientHeight} scroll=${failure.scrollWidth}x${failure.scrollHeight}`)
      .join("\n");
    throw new Error(`${viewport.label} ${viewport.width}x${viewport.height} ${check.name} failed layout probes:\n${details}`);
  }

  console.log(`layout probe ok: ${viewport.label} ${viewport.width}x${viewport.height}: ${check.name}`);
}

const server = await createServer({
  server: {
    host: "127.0.0.1",
    port: appPort,
    strictPort: true,
  },
});

let chrome;
let userDataDir;
let client;

try {
  await server.listen();
  userDataDir = await mkdtemp(join(tmpdir(), "isd-layout-probe-"));
  chrome = spawn(findBrowserExecutable(), [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore" });

  for (const viewport of viewports) {
    client = await openProbePage(viewport);
    await assertViewportMetrics(client, viewport);
    for (const check of checks) {
      await runCheck(client, check, viewport);
    }
    client.close();
    client = undefined;
  }
} finally {
  client?.close();
  if (chrome) {
    chrome.kill();
    await waitForProcessExit(chrome);
  }
  await server.close();
  if (userDataDir) {
    await removeTempDir(userDataDir);
  }
}
