import { z } from "zod";

import { createPetPhotoService } from "../../services/petPhoto/petPhotoService";
import { PetPhotoWidget } from "./PetPhotoWidget";

export const petPhotoSettingsSchema = z.object({
  provider: z.literal("staticManifest"),
  manifestPath: z.string().min(1),
  selection: z.literal("twiceDaily"),
});

export const petPhotoDefinition = {
  type: "petPhoto",
  component: PetPhotoWidget,
  settingsSchema: petPhotoSettingsSchema,
  createService: createPetPhotoService,
  fallbackArea: "sub-right",
  defaultRefreshIntervalSec: 43200,
} as const;
