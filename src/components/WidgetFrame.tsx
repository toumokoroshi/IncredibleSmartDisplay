import type { ReactNode } from "react";

import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { StaleBadge } from "./StaleBadge";
import type { WidgetError, WidgetStatus } from "../types/widget";

const defaultHeaderRowClassName = "shrink-0 flex items-start justify-between gap-3";
const defaultHeadingClassName = "widget-heading flex items-center gap-3";
const defaultTitleClassName = "text-lg uppercase tracking-[0.2em] text-slate-400";

export function WidgetFrame({
  cardClassName = "",
  children,
  error,
  hasData,
  headerExtra,
  headerRowClassName = defaultHeaderRowClassName,
  headingClassName = defaultHeadingClassName,
  icon,
  isEmpty = false,
  status,
  title,
  titleClassName = defaultTitleClassName,
}: {
  cardClassName?: string;
  children?: ReactNode;
  error?: WidgetError;
  hasData: boolean;
  headerExtra?: ReactNode;
  headerRowClassName?: string;
  headingClassName?: string;
  icon: ReactNode;
  isEmpty?: boolean;
  status: WidgetStatus;
  title: string;
  titleClassName?: string;
}) {
  return (
    <Card className={cardClassName}>
      <div className={headerRowClassName}>
        <div className={headingClassName}>
          <span className="widget-heading-icon">{icon}</span>
          <p className={titleClassName}>{title}</p>
        </div>
        {headerExtra ?? (status === "stale" ? <StaleBadge /> : null)}
      </div>
      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {isEmpty ? <EmptyState /> : null}
      {hasData && status !== "error" && status !== "loading" && !isEmpty ? children : null}
    </Card>
  );
}
