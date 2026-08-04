import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Variant = "solid" | "outline";
type Color = "cyan" | "magenta";

const base =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const styles: Record<Color, Record<Variant, string>> = {
  cyan: {
    solid:
      "bg-neon-cyan text-bg shadow-[0_0_16px_rgba(41,171,226,0.5)] hover:shadow-[0_0_28px_rgba(41,171,226,0.8)] focus-visible:ring-neon-cyan",
    outline:
      "neon-box-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_22px_rgba(41,171,226,0.6)] focus-visible:ring-neon-cyan",
  },
  magenta: {
    solid:
      "bg-neon-magenta text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] hover:shadow-[0_0_28px_rgba(236,30,140,0.85)] focus-visible:ring-neon-magenta",
    outline:
      "neon-box-magenta text-neon-magenta hover:bg-neon-magenta/10 hover:shadow-[0_0_22px_rgba(236,30,140,0.6)] focus-visible:ring-neon-magenta",
  },
};

type NeonButtonProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  color?: Color;
};

/** Botón/CTA con glow neón. Renderiza un <Link> de Next. */
export function NeonButton({
  variant = "solid",
  color = "cyan",
  className,
  ...props
}: NeonButtonProps) {
  return (
    <Link className={cn(base, styles[color][variant], className)} {...props} />
  );
}
