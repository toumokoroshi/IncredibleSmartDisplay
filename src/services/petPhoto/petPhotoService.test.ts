import { afterEach, describe, expect, it, vi } from "vitest";

import { createPetPhotoService, getHalfDaySelectionKey, resolvePublicAssetPath } from "./petPhotoService";

const settings = {
  provider: "staticManifest",
  manifestPath: "/pets/manifest.json",
  selection: "twiceDaily",
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("petPhotoService", () => {
  it("resolves public asset paths against the Vite base path", () => {
    expect(resolvePublicAssetPath("/pets/manifest.json", "/IncredibleSmartDisplay/")).toBe("/IncredibleSmartDisplay/pets/manifest.json");
    expect(resolvePublicAssetPath("pets/manifest.json", "/IncredibleSmartDisplay")).toBe("/IncredibleSmartDisplay/pets/manifest.json");
    expect(resolvePublicAssetPath("https://example.com/pets/manifest.json", "/IncredibleSmartDisplay/")).toBe(
      "https://example.com/pets/manifest.json",
    );
  });

  it("uses one selection key for morning and one for afternoon", () => {
    expect(getHalfDaySelectionKey(new Date(2026, 4, 21, 11, 59))).toBe("2026-05-21-am");
    expect(getHalfDaySelectionKey(new Date(2026, 4, 21, 12, 0))).toBe("2026-05-21-pm");
  });

  it("loads the static manifest and selects one favorite photo for the current half day", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        photos: [
          { id: "mugi-001", src: "/pets/mugi-001.jpg", favorite: true },
          { id: "mugi-002", src: "/pets/mugi-002.jpg", favorite: true },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await createPetPhotoService().fetch(settings);

    expect(fetchMock).toHaveBeenCalledWith("/pets/manifest.json", { cache: "no-store" });
    expect(data.totalPhotos).toBe(2);
    expect(data.selectedForPeriod).toMatch(/^\d{4}-\d{2}-\d{2}-(am|pm)$/);
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
