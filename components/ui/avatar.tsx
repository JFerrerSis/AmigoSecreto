import { cn, getInitials } from "@/lib/utils";

const sizeStyles = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

const palette = [
  "bg-pine/10 text-pine-deep",
  "bg-terra/10 text-terra-deep",
  "bg-gold/25 text-[#7a571a]",
  "bg-sand text-ink",
];

function paletteFor(name: string) {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeStyles;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const safeName = name?.trim() || "Invitado";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`Avatar de ${safeName}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(
          "shrink-0 rounded-full border border-line/80 object-cover",
          sizeStyles[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-line/70 font-bold",
        paletteFor(safeName),
        sizeStyles[size],
        className,
      )}
    >
      {getInitials(safeName)}
    </span>
  );
}
