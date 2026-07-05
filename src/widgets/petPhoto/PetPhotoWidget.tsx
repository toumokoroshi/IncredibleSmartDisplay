import { Heart } from "lucide-react";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { WidgetFrame } from "../../components/WidgetFrame";
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
    <WidgetFrame
      cardClassName="flex flex-col gap-3 p-4"
      error={error}
      hasData={data?.photo !== undefined}
      icon={<Heart aria-hidden="true" size={22} strokeWidth={1.9} />}
      isEmpty={isEmpty}
      status={status}
      title={config.title}
    >
      {data?.photo ? <PetPhotoQuickLook src={data.photo.src} totalPhotos={data.totalPhotos} /> : null}
    </WidgetFrame>
  );
}

function PetPhotoQuickLook({ src, totalPhotos }: { src: string; totalPhotos: number }) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3">
      <div className="min-h-0 overflow-hidden rounded-2xl bg-slate-200">
        <img className="h-full w-full object-contain" src={src} alt="" />
      </div>
      <p className="text-base font-semibold text-slate-500">{totalPhotos}枚</p>
    </div>
  );
}

function PetPhotoDetail({ src }: { src: string }) {
  return (
    <div className="widget-detail-root widget-detail-primary petPhoto-detail-root petPhoto-detail-media h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-slate-200">
      <img className="h-full w-full object-contain" src={src} alt="" />
    </div>
  );
}
