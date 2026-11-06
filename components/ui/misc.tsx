import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-paper shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

type BadgeVariant = "pending" | "completed" | "neutral" | "gold";

const badgeStyles: Record<BadgeVariant, string> = {
  pending: "border-gold/40 bg-gold/15 text-[#8a641f]",
  completed: "border-pine/20 bg-pine/10 text-pine-deep",
  neutral: "border-line bg-cream text-muted",
  gold: "border-gold/40 bg-gold/20 text-[#7a571a]",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-sand/90", className)}
      {...props}
    />
  );
}

export function InlineAlert({
  children,
  variant = "error",
  className,
}: {
  children: ReactNode;
  variant?: "error" | "warning" | "info";
  className?: string;
}) {
  const styles = {
    error: "border-terra/20 bg-terra/5 text-terra-deep",
    warning: "border-gold/30 bg-gold/10 text-[#7a571a]",
    info: "border-pine/15 bg-pine/5 text-pine-deep",
  };

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed",
        styles[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}
