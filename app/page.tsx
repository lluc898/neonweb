import Image from "next/image";
import { NeonText } from "@/components/neon/neon-text";
import { NeonButton } from "@/components/neon/neon-button";
import { NeonLoader } from "@/components/neon/neon-loader";

const categorias = [
  { nombre: "Bodas", color: "magenta" as const },
  { nombre: "Cumpleaños", color: "cyan" as const },
  { nombre: "Frases famosas", color: "yellow" as const },
  { nombre: "Dibujos e iconos", color: "cyan" as const },
  { nombre: "Negocios", color: "magenta" as const },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center">
      {/* ---------- HERO ---------- */}
      <section className="relative flex w-full max-w-5xl flex-col items-center px-6 pt-20 pb-24 text-center">
        <Image
          src="/logo.webp"
          alt="Neon Led Spain"
          width={280}
          height={270}
          priority
          className="mb-10 h-auto w-56 drop-shadow-[0_0_25px_rgba(41,171,226,0.35)]"
        />

        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-muted">
          Neones LED · Hechos en España
        </p>

        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight sm:text-6xl">
          Ilumina lo tuyo con un{" "}
          <NeonText color="cyan" flicker>
            neón
          </NeonText>{" "}
          hecho a{" "}
          <NeonText color="magenta">medida</NeonText>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted">
          Diseña tu neón personalizado y velo cobrar vida en tiempo real. O
          elige uno de nuestros diseños listos para brillar.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <NeonButton href="/personalizar" color="cyan">
            Diseña tu neón
          </NeonButton>
          <NeonButton href="/productos" color="magenta" variant="outline">
            Ver catálogo
          </NeonButton>
        </div>
      </section>

      {/* ---------- CATEGORÍAS ---------- */}
      <section className="w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-2xl font-bold">
          Explora por ocasión
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categorias.map((c) => (
            <span
              key={c.nombre}
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-text transition-colors hover:border-transparent"
            >
              <NeonText color={c.color}>{c.nombre}</NeonText>
            </span>
          ))}
        </div>
      </section>

      {/* ---------- SISTEMA DE DISEÑO (temporal, para revisar el andamiaje) ---------- */}
      <section className="w-full max-w-5xl px-6 pb-28">
        <div className="rounded-2xl border border-border bg-surface/60 p-8">
          <p className="mb-6 text-xs uppercase tracking-widest text-muted">
            Vista previa del sistema de diseño · se elimina más adelante
          </p>
          <div className="flex flex-wrap items-center gap-10">
            <div className="space-y-2">
              <NeonText as="p" color="cyan" className="text-2xl font-bold">
                Cian
              </NeonText>
              <NeonText as="p" color="magenta" className="text-2xl font-bold">
                Magenta
              </NeonText>
              <NeonText as="p" color="yellow" className="text-2xl font-bold">
                Amarillo
              </NeonText>
            </div>
            <NeonLoader />
            <p className="font-[family-name:var(--font-script)] text-4xl text-neon-yellow">
              Neon Led Spain
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
