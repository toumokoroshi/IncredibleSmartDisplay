export function MaterialSymbol({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded ${className}`}>
      {children}
    </span>
  );
}
