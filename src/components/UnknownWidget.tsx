import { Card } from "./Card";

export function UnknownWidget({ title, type }: { title: string; type: string }) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/10">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Unknown Widget</p>
      <p className="mt-3 text-2xl font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-amber-100/70">Type: {type}</p>
    </Card>
  );
}
