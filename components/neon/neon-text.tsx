import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

type NeonColor = "cyan" | "magenta" | "yellow";

const glowClass: Record<NeonColor, string> = {
  cyan: "neon-cyan",
  magenta: "neon-magenta",
  yellow: "neon-yellow",
};

type NeonTextProps = {
  children: ReactNode;
  color?: NeonColor;
  /** Etiqueta HTML a renderizar (h1, span, p...). Por defecto span. */
  as?: ElementType;
  /** Parpadeo sutil de tubo de neón. */
  flicker?: boolean;
  className?: string;
};

/**
 * Texto con efecto de neón encendido. Acento de marca — usar con moderación.
 */
export function NeonText({
  children,
  color = "cyan",
  as: Tag = "span",
  flicker = false,
  className,
}: NeonTextProps) {
  return (
    <Tag
      className={cn(glowClass[color], flicker && "animate-flicker", className)}
    >
      {children}
    </Tag>
  );
}
