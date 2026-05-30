import { z } from "zod";

import { createPetPhotoService } from "../../services/petPhoto/petPhotoService";
import { PetPhotoWidget } from "./PetPhotoWidget";
import type { PetPhotoData } from "./types";

export const petPhotoSettingsSchema = z.object({
  provider: z.literal("staticManifest"),
  manifestPath: z.string().min(1),
  selection: z.literal("twiceDaily"),
});

const petPhotoDataSchema: z.ZodType<PetPhotoData> = z.object({
  photo: z
    .object({
      id: z.string(),
      src: z.string(),
      favorite: z.boolean(),
    })
    .optional(),
  totalPhotos: z.number(),
  selectedForPeriod: z.string(),
});

export const petPhotoDefinition = {
  type: "petPhoto",
  component: PetPhotoWidget,
  settingsSchema: petPhotoSettingsSchema,
  createService: createPetPhotoService,
  fallbackArea: "sub-right",
  defaultRefreshIntervalSec: 43200,
  cacheTtlHours: 24,
  validateData: (data: unknown): data is PetPhotoData => petPhotoDataSchema.safeParse(data).success,
  isEmpty: (data: PetPhotoData) => data.photo === undefined,
  detailDisplayMode: "petPhoto",
} as const;
