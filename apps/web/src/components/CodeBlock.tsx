import * as React from "react";

/** A window-chrome code sample. Server-renderable; no highlighting dependency. */
export function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="code">
      <div className="code-bar">
        <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
        {title && <span className="ml-1.5">{title}</span>}
      </div>
      <pre className="code-oneline" tabIndex={0} role="region" aria-label={`${title ?? "Code"} sample`}>{children}</pre>
    </div>
  );
}
