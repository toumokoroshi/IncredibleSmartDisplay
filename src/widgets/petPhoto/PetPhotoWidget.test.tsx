import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WidgetConfig, WidgetError } from "../../types/widget";
import { PetPhotoWidget } from "./PetPhotoWidget";
import type { PetPhotoData, PetPhotoSettings } from "./types";

const config: WidgetConfig<PetPhotoSettings> = {
  id: "pet-photo-main",
  type: "petPhoto",
  title: "今日のぐり",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 43200,
  order: 5,
  area: "sub-right",
  settings: {
    provider: "staticManifest",
    manifestPath: "/pets/manifest.json",
    selection: "twiceDaily",
  },
};

const data: PetPhotoData = {
  photo: { favorite: true, id: "photo-1", src: "/pets/photo-1.jpg" },
  selectedForPeriod: "2026-05-20-am",
  totalPhotos: 42,
};

describe("PetPhotoWidget", () => {
  it("renders the quick look photo and total count", () => {
    const { container } = render(<PetPhotoWidget config={config} data={data} isEmpty={false} isHighlighted={false} status="success" />);

    expect(screen.getByText("今日のぐり")).toBeInTheDocument();
    expect(screen.getByText("42 photos / AM-PM pick")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("src", "/pets/photo-1.jpg");
  });

  it("renders the detail photo when highlighted", () => {
    const { container } = render(<PetPhotoWidget config={config} data={data} isEmpty={false} isHighlighted status="success" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "/pets/photo-1.jpg");
    expect(screen.queryByText("今日のぐり")).not.toBeInTheDocument();
  });

  it("renders loading, error, empty, and stale states", () => {
    const error: WidgetError = { code: "DATA_INVALID", message: "manifest invalid", retryable: false };
    const { rerender } = render(<PetPhotoWidget config={config} isEmpty={false} isHighlighted={false} status="loading" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    rerender(<PetPhotoWidget config={config} error={error} isEmpty={false} isHighlighted={false} status="error" />);
    expect(screen.getByText("manifest invalid")).toBeInTheDocument();

    rerender(<PetPhotoWidget config={config} data={{ selectedForPeriod: "2026-05-20-am", totalPhotos: 0 }} isEmpty isHighlighted={false} status="success" />);
    expect(screen.getByText("No data available.")).toBeInTheDocument();

    rerender(<PetPhotoWidget config={config} data={data} isEmpty={false} isHighlighted={false} status="stale" />);
    expect(screen.getByText("Stale")).toBeInTheDocument();
  });
});
