import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "mb-6"}>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {children ? (
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}
