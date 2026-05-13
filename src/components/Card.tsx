import type { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={`widget-card h-full overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--panel-stroke)] bg-[var(--panel-bg)] p-5 shadow-[var(--panel-shadow)] backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}
