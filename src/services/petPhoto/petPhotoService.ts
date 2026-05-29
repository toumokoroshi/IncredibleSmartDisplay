import { z } from "zod";

import type { WidgetError, WidgetService } from "../../types/widget";
import { resolvePublicAssetPath } from "../../utils/publicAssetPath";
import { fetchJsonProvider } from "../jsonProvider";
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

export { resolvePublicAssetPath };

function createDataInvalidError(message: string) {
  const error = new Error(message) as Error & WidgetError;
  error.code = "DATA_INVALID";
  error.retryable = false;
  return error;
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
  const payload = await fetchJsonProvider({
    failureMessagePrefix: "Failed to load pet photo manifest",
    init: { cache: "no-store" },
    invalidMessage: "Invalid pet photo manifest",
    url: path,
    validate: (value): value is unknown => value !== undefined,
  });
  const parsed = petPhotoManifestSchema.safeParse(payload);
  if (!parsed.success) {
    throw createDataInvalidError("Invalid pet photo manifest");
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
