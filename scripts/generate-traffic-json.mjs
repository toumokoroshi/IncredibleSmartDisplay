import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VALID_STATUSES = new Set(["normal", "delayed", "partiallyDelayed", "suspended", "unknown"]);

if (isDirectRun()) {
  await generateTrafficJsonFromEnv();
}

export async function generateTrafficJsonFromEnv(env = process.env) {
  return generateTrafficJson({
    generatedAtDate: new Date(),
    inputPath: resolve(process.cwd(), env.TRAFFIC_SOURCE_PATH ?? "data-sources/traffic.manual.json"),
    outputPath: resolve(process.cwd(), env.TRAFFIC_OUTPUT_PATH ?? "public/data/traffic.json"),
  });
}

export async function generateTrafficJson({ generatedAtDate, inputPath, outputPath }) {
  const source = JSON.parse(await readFile(inputPath, "utf8"));
  const data = buildTrafficData(source, generatedAtDate);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`Generated ${data.lines.length} traffic lines at ${outputPath}`);
  return data;
}

export function buildTrafficData(source, generatedAtDate) {
  validateTrafficSource(source);

  return {
    generatedAt: generatedAtDate.toISOString(),
    updatedAt: source.updatedAt,
    lines: source.lines.map((line) => ({
      id: line.id,
      name: line.name,
      ...(line.operator === undefined ? {} : { operator: line.operator }),
      status: line.status,
      updatedAt: line.updatedAt,
      ...(line.delayMinutes === undefined ? {} : { delayMinutes: line.delayMinutes }),
      ...(line.statusText === undefined ? {} : { statusText: line.statusText }),
      ...(line.detail === undefined ? {} : { detail: line.detail }),
      ...(line.reason === undefined ? {} : { reason: line.reason }),
      ...(line.recoveryEstimate === undefined ? {} : { recoveryEstimate: line.recoveryEstimate }),
      ...(line.alternateTransport === undefined ? {} : { alternateTransport: line.alternateTransport }),
    })),
  };
}

function validateTrafficSource(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid traffic source: root must be an object");
  }

  if (!isIsoDateTimeString(value.updatedAt)) {
    throw new Error("Invalid traffic source: updatedAt");
  }

  if (!Array.isArray(value.lines) || value.lines.length === 0) {
    throw new Error("Invalid traffic source: lines");
  }

  const seenIds = new Set();
  for (const line of value.lines) {
    validateTrafficLine(line, seenIds);
  }
}

function validateTrafficLine(line, seenIds) {
  if (!line || typeof line !== "object" || Array.isArray(line)) {
    throw new Error("Invalid traffic source line");
  }

  for (const key of ["id", "name", "status", "updatedAt"]) {
    if (typeof line[key] !== "string" || line[key].trim().length === 0) {
      throw new Error(`Invalid traffic source line: ${key}`);
    }
  }

  if (seenIds.has(line.id)) {
    throw new Error(`Invalid traffic source line: duplicate id ${line.id}`);
  }
  seenIds.add(line.id);

  if (!VALID_STATUSES.has(line.status)) {
    throw new Error(`Invalid traffic source line: status ${line.status}`);
  }

  if (!isIsoDateTimeString(line.updatedAt)) {
    throw new Error(`Invalid traffic source line: updatedAt ${line.id}`);
  }

  for (const key of ["operator", "statusText", "detail", "reason", "recoveryEstimate", "alternateTransport"]) {
    if (line[key] !== undefined && typeof line[key] !== "string") {
      throw new Error(`Invalid traffic source line: ${key} ${line.id}`);
    }
  }

  if (line.delayMinutes !== undefined && typeof line.delayMinutes !== "number") {
    throw new Error(`Invalid traffic source line: delayMinutes ${line.id}`);
  }
}

function isIsoDateTimeString(value) {
  return typeof value === "string" && Number.isNaN(Date.parse(value)) === false;
}

function isDirectRun() {
  return process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
}
