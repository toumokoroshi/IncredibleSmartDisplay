import type { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={`h-full rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}
