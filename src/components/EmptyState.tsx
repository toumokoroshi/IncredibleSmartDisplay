export function EmptyState({ message = "No data available." }: { message?: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-center text-slate-300">
      {message}
    </div>
  );
}
