import * as React from "react";
import { Rise } from "@/components/motion";

export function PageHeader({
  eyebrow,
  title,
  children,
  className,
  actions,
  compact,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  /** On phones, hide the lede so the primary control (e.g. the body map) sits higher on screen. */
  compact?: boolean;
}) {
  return (
    <Rise className={className ? `page-head ${className}` : "page-head"} data-compact={compact ? "" : undefined}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children ? <div className="lede">{children}</div> : null}
      {actions ? <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </Rise>
  );
}
