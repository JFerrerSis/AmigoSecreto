import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  htmlFor,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-sm font-semibold text-ink"
        >
          {label}
        </label>
        {optional ? (
          <span className="text-xs text-muted">Opcional</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-terra-deep">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
