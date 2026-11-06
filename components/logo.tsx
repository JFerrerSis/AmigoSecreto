import Link from "next/link";
import { Gift } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className,
      )}
      aria-label="Amigo Secreto, ir al inicio"
    >
      <span className="flex size-9 items-center justify-center rounded-2xl bg-pine text-paper shadow-[0_6px_16px_-8px_rgba(47,93,80,0.9)] transition-transform duration-300 group-hover:-rotate-6">
        <Gift className="size-[18px]" strokeWidth={1.8} />
      </span>
      {!compact ? (
        <span className="font-display text-xl leading-none tracking-[-0.01em] text-ink">
          Amigo Secreto
        </span>
      ) : null}
    </Link>
  );
}
