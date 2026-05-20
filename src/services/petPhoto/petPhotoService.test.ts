import { afterEach, describe, expect, it, vi } from "vitest";

import { createPetPhotoService } from "./petPhotoService";

const settings = {
  provider: "staticManifest",
  manifestPath: "/pets/manifest.json",
  selection: "daily",
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("petPhotoService", () => {
  it("loads the static manifest and selects one favorite photo for the day", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          photos: [
            { id: "mugi-001", src: "/pets/mugi-001.jpg", favorite: true },
            { id: "mugi-002", src: "/pets/mugi-002.jpg", favorite: true },
          ],
        }),
      })),
    );

    const data = await createPetPhotoService().fetch(settings);

    expect(data.totalPhotos).toBe(2);
    expect(data.selectedForDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.photo?.src).toMatch(/^\/pets\/mugi-00[12]\.jpg$/);
  });

  it("returns empty data when no favorite photos are registered", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ photos: [] }),
      })),
    );

    const data = await createPetPhotoService().fetch(settings);

    expect(data.totalPhotos).toBe(0);
    expect(data.photo).toBeUndefined();
  });
});
