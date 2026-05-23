import { Heart } from "lucide-react";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { PetPhotoData, PetPhotoSettings } from "./types";

export function PetPhotoWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<PetPhotoSettings, PetPhotoData>) {
  if (isHighlighted) {
    return (
      <Card className="p-0">
        {status === "loading" ? <LoadingState /> : null}
        {status === "error" ? <ErrorState error={error} /> : null}
        {isEmpty ? <EmptyState /> : null}
        {data?.photo && status !== "error" && status !== "loading" ? <PetPhotoDetail src={data.photo.src} /> : null}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="shrink-0 flex items-start justify-between gap-3">
        <div className="widget-heading flex items-center gap-3">
          <span className="widget-heading-icon">
            <Heart aria-hidden="true" size={22} strokeWidth={1.9} />
          </span>
          <p className="text-lg uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        </div>
        {status === "stale" ? <StaleBadge /> : null}
      </div>
      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {isEmpty ? <EmptyState /> : null}
      {data?.photo && status !== "error" && status !== "loading" ? <PetPhotoQuickLook src={data.photo.src} totalPhotos={data.totalPhotos} /> : null}
    </Card>
  );
}

function PetPhotoQuickLook({ src, totalPhotos }: { src: string; totalPhotos: number }) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3">
      <div className="min-h-0 overflow-hidden rounded-2xl bg-slate-200">
        <img className="h-full w-full object-cover" src={src} alt="" />
      </div>
      <p className="text-base font-semibold text-slate-500">{totalPhotos} photos / AM-PM pick</p>
    </div>
  );
}

function PetPhotoDetail({ src }: { src: string }) {
  return (
    <div className="h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-slate-200">
      <img className="h-full w-full object-cover" src={src} alt="" />
    </div>
  );
}
