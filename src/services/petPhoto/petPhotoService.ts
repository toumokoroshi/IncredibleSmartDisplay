import { z } from "zod";

import type { WidgetService } from "../../types/widget";
import type { PetPhotoData, PetPhotoManifest, PetPhotoSettings } from "../../widgets/petPhoto";

const petPhotoManifestSchema = z.object({
  photos: z
    .array(
      z.object({
        id: z.string().min(1),
        src: z.string().min(1),
        favorite: z.boolean().default(true),
      }),
    )
    .default([]),
});

export function getHalfDaySelectionKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const period = date.getHours() < 12 ? "am" : "pm";
  return `${year}-${month}-${day}-${period}`;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolvePublicAssetPath(path: string, basePath = import.meta.env.BASE_URL) {
  if (/^[a-z][a-z\d+\-.]*:/i.test(path) || path.startsWith("//")) {
    return path;
  }

  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

function selectHalfDayPhoto(manifest: PetPhotoManifest) {
  const candidates = manifest.photos.filter((photo) => photo.favorite);
  const selectedForPeriod = getHalfDaySelectionKey();

  if (candidates.length === 0) {
    return { selectedForPeriod, photo: undefined };
  }

  return {
    selectedForPeriod,
    photo: candidates[hashString(selectedForPeriod) % candidates.length],
  };
}

async function fetchManifest(path: string): Promise<PetPhotoManifest> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load pet photo manifest: ${response.status}`);
  }

  const parsed = petPhotoManifestSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Invalid pet photo manifest");
  }

  return parsed.data;
}

export function createPetPhotoService(): WidgetService<PetPhotoSettings, PetPhotoData> {
  return {
    async fetch(settings) {
      const manifest = await fetchManifest(resolvePublicAssetPath(settings.manifestPath));
      const { photo, selectedForPeriod } = selectHalfDayPhoto(manifest);

      return {
        photo: photo ? { ...photo, src: resolvePublicAssetPath(photo.src) } : undefined,
        selectedForPeriod,
        totalPhotos: manifest.photos.length,
      };
    },
  };
}
