import type { CSSProperties, ReactNode } from "react";
import { cn, hexToRgba } from "@/lib/utils";

/**
 * "Escenario" de producto: simula el neón colgado en una pared real
 * (ladrillo oscuro + resplandor ambiental del color del neón + viñeta).
 * Diferencia las tarjetas del fondo de la página y les da aspecto
 * de foto de producto. Al hacer hover (dentro de un padre `group`),
 * el resplandor se intensifica como si el neón subiera de brillo.
 */

const BRICK_WALL: CSSProperties = {
  backgroundColor: "#20140f",
  backgroundImage: [
    "linear-gradient(335deg, #140c08 23px, transparent 23px)",
    "linear-gradient(155deg, #140c08 23px, transparent 23px)",
    "linear-gradient(335deg, #140c08 23px, transparent 23px)",
    "linear-gradient(155deg, #140c08 23px, transparent 23px)",
  ].join(", "),
  backgroundSize: "58px 58px",
  backgroundPosition: "0px 2px, 4px 35px, 29px 31px, 34px 6px",
};

export function NeonStage({
  color,
  children,
  className,
}: {
  /** Color del neón: tiñe el resplandor ambiental de la escena. */
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Pared de ladrillo */}
      <div className="absolute inset-0" style={BRICK_WALL} aria-hidden />

      {/* Resplandor ambiental del color del neón sobre la pared */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(75% 70% at 50% 42%, ${hexToRgba(color, 0.18)}, transparent 72%)`,
        }}
        aria-hidden
      />
      {/* Capa extra de brillo que se enciende al hover (padre con `group`) */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(70% 62% at 50% 42%, ${hexToRgba(color, 0.16)}, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* Viñeta inferior (suelo/sombra) + marco interior sutil */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_44px_rgba(0,0,0,0.55)]"
        aria-hidden
      />

      {/*
        `self-stretch` + `flex-1`: el contenido necesita una caja con altura y
        anchura definidas. Sin esto, un SVG con width/height al 100% no tiene
        contra qué resolver el porcentaje y se sale del escenario.
        Se usa `self-stretch` y no `h-full` porque hay escenarios con solo
        `min-height`, donde un porcentaje de altura no resuelve.
      */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center self-stretch">
        {children}
      </div>
    </div>
  );
}
