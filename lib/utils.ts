import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convierte un color hex (#rrggbb) a rgba con la opacidad indicada. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Genera el text-shadow multicapa que imita el resplandor de un tubo de neón.
 * `intensity` (0–1) atenúa el brillo (útil para el efecto de "apagado").
 */
export function neonTextGlow(hex: string, intensity = 1): string {
  const layers = [
    [2, 0.95],
    [6, 0.85],
    [12, 0.7],
    [22, 0.5],
    [40, 0.3],
  ] as const;
  return layers
    .map(([blur, a]) => `0 0 ${blur}px ${hexToRgba(hex, a * intensity)}`)
    .join(", ");
}
