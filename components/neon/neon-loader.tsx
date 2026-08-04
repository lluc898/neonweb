import { cn } from "@/lib/utils";

/**
 * Loader de marca: un tubo de neón que "pulsa" mientras carga.
 * Respeta prefers-reduced-motion (la animación se desactiva sola vía CSS).
 */
export function NeonLoader({
  label = "Cargando…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-4", className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-end gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="animate-neon-pulse block w-1.5 rounded-full bg-neon-cyan neon-box-cyan"
            style={{
              height: `${16 + (i % 3) * 10}px`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
