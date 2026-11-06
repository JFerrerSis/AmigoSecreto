import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-paper px-4 text-[15px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition placeholder:text-muted/55 hover:border-ink/15 focus:border-pine/40 focus:ring-4 focus:ring-pine/10 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-line bg-paper px-4 pr-10 text-[15px] text-ink outline-none transition hover:border-ink/15 focus:border-pine/40 focus:ring-4 focus:ring-pine/10 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}
