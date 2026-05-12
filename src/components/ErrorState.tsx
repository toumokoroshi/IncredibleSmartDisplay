import type { WidgetError } from "../types/widget";

export function ErrorState({ error }: { error?: WidgetError }) {
  return (
    <div className="flex h-full min-h-24 flex-col items-center justify-center rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-center">
      <p className="text-lg font-semibold text-rose-200">Unable to load widget</p>
      <p className="mt-2 text-sm text-rose-100/80">{error?.message ?? "Unknown error"}</p>
    </div>
  );
}
