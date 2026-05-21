import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDir = path.resolve(process.cwd(), "private-pet-photos");
const outputDir = path.resolve(process.cwd(), "public", "pets");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png"]);
const exifHeader = Buffer.from("Exif\0\0", "ascii");

function normalizeId(filename) {
  const parsed = path.parse(filename);
  const normalized = parsed.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || `pet-photo-${Date.now()}`;
}

function readUInt16(buffer, offset, littleEndian) {
  return littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
}

function readUInt32(buffer, offset, littleEndian) {
  return littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
}

function readJpegOrientation(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Invalid JPEG file");
  }

  let offset = 2;

  while (offset + 4 <= buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + length;
    if (segmentEnd > buffer.length) {
      throw new Error("Invalid JPEG segment length");
    }

    if (marker === 0xe1 && buffer.subarray(segmentStart, segmentStart + exifHeader.length).equals(exifHeader)) {
      const tiffStart = segmentStart + exifHeader.length;
      if (tiffStart + 8 > segmentEnd) {
        return undefined;
      }

      const byteOrder = buffer.toString("ascii", tiffStart, tiffStart + 2);
      const littleEndian = byteOrder === "II";
      if (!littleEndian && byteOrder !== "MM") {
        return undefined;
      }

      if (readUInt16(buffer, tiffStart + 2, littleEndian) !== 42) {
        return undefined;
      }

      const ifdOffset = readUInt32(buffer, tiffStart + 4, littleEndian);
      const ifdStart = tiffStart + ifdOffset;
      if (ifdStart + 2 > segmentEnd) {
        return undefined;
      }

      const entryCount = readUInt16(buffer, ifdStart, littleEndian);
      for (let index = 0; index < entryCount; index += 1) {
        const entryStart = ifdStart + 2 + index * 12;
        if (entryStart + 12 > segmentEnd) {
          return undefined;
        }

        if (readUInt16(buffer, entryStart, littleEndian) === 0x0112) {
          const orientation = readUInt16(buffer, entryStart + 8, littleEndian);
          return orientation >= 1 && orientation <= 8 ? orientation : undefined;
        }
      }
    }

    offset = segmentEnd;
  }

  return undefined;
}

function createOrientationExifSegment(orientation) {
  const payload = Buffer.alloc(exifHeader.length + 26);
  exifHeader.copy(payload, 0);
  const tiffStart = exifHeader.length;

  payload.write("MM", tiffStart, "ascii");
  payload.writeUInt16BE(42, tiffStart + 2);
  payload.writeUInt32BE(8, tiffStart + 4);
  payload.writeUInt16BE(1, tiffStart + 8);
  payload.writeUInt16BE(0x0112, tiffStart + 10);
  payload.writeUInt16BE(3, tiffStart + 12);
  payload.writeUInt32BE(1, tiffStart + 14);
  payload.writeUInt16BE(orientation, tiffStart + 18);
  payload.writeUInt16BE(0, tiffStart + 20);
  payload.writeUInt32BE(0, tiffStart + 22);

  const segment = Buffer.alloc(payload.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);
  return segment;
}

function stripJpegMetadata(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Invalid JPEG file");
  }

  const chunks = [buffer.subarray(0, 2)];
  const orientation = readJpegOrientation(buffer);
  if (orientation && orientation !== 1) {
    chunks.push(createOrientationExifSegment(orientation));
  }

  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xda) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (marker === 0xd9) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const segmentEnd = offset + 2 + length;
    if (segmentEnd > buffer.length) {
      throw new Error("Invalid JPEG segment length");
    }

    const isAppSegment = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;
    if (!isAppSegment && !isComment) {
      chunks.push(buffer.subarray(offset, segmentEnd));
    }
    offset = segmentEnd;
  }

  return Buffer.concat(chunks);
}

function stripPngMetadata(buffer) {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < pngSignature.length || !buffer.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error("Invalid PNG file");
  }

  const chunks = [buffer.subarray(0, pngSignature.length)];
  let offset = pngSignature.length;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const typeEnd = typeStart + 4;
    const dataEnd = typeEnd + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) {
      throw new Error("Invalid PNG chunk length");
    }

    const type = buffer.toString("ascii", typeStart, typeEnd);
    const isCriticalChunk = type[0] >= "A" && type[0] <= "Z";
    if (isCriticalChunk) {
      chunks.push(buffer.subarray(offset, chunkEnd));
    }

    offset = chunkEnd;
    if (type === "IEND") {
      break;
    }
  }

  return Buffer.concat(chunks);
}

function stripMetadata(buffer, extension) {
  if (extension === ".jpg" || extension === ".jpeg") {
    return stripJpegMetadata(buffer);
  }
  if (extension === ".png") {
    return stripPngMetadata(buffer);
  }
  throw new Error(`Unsupported file type: ${extension}`);
}

async function getSourceFiles() {
  try {
    const entries = await readdir(sourceDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((filename) => supportedExtensions.has(path.extname(filename).toLowerCase()))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function cleanOutputDir() {
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(outputDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && (supportedExtensions.has(path.extname(entry.name).toLowerCase()) || entry.name === "manifest.json"))
      .map((entry) => rm(path.join(outputDir, entry.name))),
  );
}

async function main() {
  const files = await getSourceFiles();
  await cleanOutputDir();

  const photos = [];
  const usedIds = new Map();

  for (const filename of files) {
    const extension = path.extname(filename).toLowerCase() === ".jpeg" ? ".jpg" : path.extname(filename).toLowerCase();
    const baseId = normalizeId(filename);
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
    const outputFilename = `${id}${extension}`;
    const inputPath = path.join(sourceDir, filename);
    const outputPath = path.join(outputDir, outputFilename);
    const sanitized = stripMetadata(await readFile(inputPath), extension);

    await writeFile(outputPath, sanitized);
    photos.push({
      id,
      src: `/pets/${outputFilename}`,
      favorite: true,
    });
  }

  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify({ photos }, null, 2)}\n`, "utf8");
  console.log(`Prepared ${photos.length} pet photo(s) in ${path.relative(process.cwd(), outputDir)}`);
}

await main();
