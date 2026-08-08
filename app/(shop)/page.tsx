import Link from "next/link";
import type { Metadata } from "next";
import { NeonConfigurator } from "@/components/neon/neon-configurator";
import { NeonText } from "@/components/neon/neon-text";
import { NeonButton } from "@/components/neon/neon-button";
import { ProductSlider } from "@/components/shop/product-slider";
import { PhotoStrip } from "@/components/shop/photo-strip";
import { TrustpilotRating } from "@/components/shop/trustpilot-rating";
import { getCategories, getConfiguratorOptions, getProducts } from "@/lib/catalog";
import { getShippingRates } from "@/lib/order-pricing";
import { formatEUR } from "@/lib/pricing";
import { configuratorFontVars } from "@/lib/neon-fonts";

export const metadata: Metadata = {
  title: "Neones LED personalizados | Neon Led Spain",
  description:
    "Diseña tu neón LED personalizado y velo en vivo con precio al instante. Fabricación artesanal en Mallorca, envío a toda España.",
};

// Portada con datos de la BD (productos y tarifas). El admin la refresca al editar.
export const revalidate = 300;

const STEPS = [
  {
    n: "01",
    title: "Diseña tu neón",
    text: "Escribe tu texto, elige tipografía, color y tamaño. Lo ves encenderse al instante con su precio.",
  },
  {
    n: "02",
    title: "Lo fabricamos a mano",
    text: "Montamos tu neón LED en nuestro taller de Mallorca sobre acrílico cortado a medida.",
  },
  {
    n: "03",
    title: "Llega listo para colgar",
    text: "Con transformador, fijaciones y manual. Solo tienes que enchufarlo y disfrutarlo.",
  },
];

const BENEFITS = [
  { icon: "✋", title: "Hecho a mano en Mallorca", text: "Fabricación propia, no revendemos." },
  { icon: "⚡", title: "Bajo consumo LED", text: "Gasta mucho menos que el neón de gas." },
  { icon: "🛠️", title: "Listo para instalar", text: "Transformador y fijaciones incluidos." },
  { icon: "🌧️", title: "Opción exterior", text: "Acabado resistente al agua (IP65)." },
];

/** Cabecera de sección: antetítulo + titular, para dar ritmo a la portada. */
function SectionHeading({
  eyebrow,
  children,
  align = "center",
}: {
  eyebrow: string;
  children: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted">{eyebrow}</p>
      <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

export default async function Home() {
  const [products, categories, options, shipping] = await Promise.all([
    getProducts(),
    getCategories(),
    getConfiguratorOptions(),
    getShippingRates(),
  ]);

  const featured = products.slice(0, 8);

  return (
    <main className={`${configuratorFontVars} flex flex-1 flex-col`}>
      {/* ---------------- HERO ----------------
          Sin fotografía de fondo y sin el emblema: el titular es el que manda.
          La profundidad la da el resplandor ambiental + una rejilla muy tenue. */}
      <section className="relative isolate overflow-hidden px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div
          className="absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(65%_60%_at_50%_30%,black,transparent)]"
          aria-hidden
        />
        <div
          className="absolute left-1/2 top-[-18rem] -z-10 h-[38rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(41,171,226,0.20),transparent)] blur-2xl"
          aria-hidden
        />
        <div
          className="absolute left-[70%] top-[-8rem] -z-10 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(236,30,140,0.16),transparent)] blur-2xl"
          aria-hidden
        />

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(41,171,226,0.9)]" aria-hidden />
            Taller propio en Marratxí, Mallorca
          </span>

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            Ilumina lo tuyo con un{" "}
            <NeonText color="cyan" flicker>
              neón
            </NeonText>{" "}
            hecho a <NeonText color="magenta">medida</NeonText>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-muted">
            Escribe tu texto y velo cobrar vida al instante, con su precio en
            tiempo real. Sin sorpresas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <NeonButton href="#configurador" color="cyan">
              Diseñar mi neón
            </NeonButton>
            <NeonButton href="/productos" color="magenta" variant="outline">
              Ver catálogo
            </NeonButton>
          </div>

          <TrustpilotRating className="mt-8" />

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <li>✓ Fabricación en 3-5 días</li>
            <li>✓ Envío gratis desde {formatEUR(shipping.freeFromCents / 100)}</li>
            <li>✓ Diseño confirmado antes de fabricar</li>
          </ul>
        </div>
      </section>

      {/* ---------------- FOTOS REALES (tira horizontal) ---------------- */}
      <section className="pb-14">
        <PhotoStrip />
      </section>

      {/* ---------------- CONFIGURADOR (la joya, en portada) ---------------- */}
      <section
        id="configurador"
        className="scroll-mt-20 border-y border-border bg-surface/20 py-14 sm:py-16"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-8">
            <SectionHeading eyebrow="Configurador">
              Diseña tu neón <span className="neon-cyan">aquí mismo</span>
            </SectionHeading>
            <p className="mx-auto mt-2 max-w-xl text-center text-muted">
              Cambia el texto, la tipografía y el color: la vista previa y el
              precio se actualizan al momento.
            </p>
          </div>

          <NeonConfigurator options={options} />
        </div>
      </section>

      {/* ---------------- CATÁLOGO (slider) ---------------- */}
      <section className="py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Catálogo" align="left">
              ¿Prefieres un diseño listo?
            </SectionHeading>
            <Link
              href="/productos"
              className="text-sm font-semibold text-neon-cyan transition-colors hover:text-text"
            >
              Ver todo el catálogo →
            </Link>
          </div>

          <ProductSlider products={featured} />
        </div>
      </section>

      {/* ---------------- CÓMO FUNCIONA ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <SectionHeading eyebrow="Cómo funciona">Así de fácil</SectionHeading>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-neon-cyan/40"
            >
              <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-neon-cyan">
                {s.n}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-text">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- CATEGORÍAS ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <SectionHeading eyebrow="Ideas">Para cada ocasión</SectionHeading>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href="/productos"
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-neon-cyan/60"
            >
              <NeonText color={(["magenta", "cyan", "yellow"] as const)[i % 3]}>
                {c.label}
              </NeonText>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- DISEÑO A MEDIDA ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-neon-magenta/30 bg-gradient-to-br from-neon-magenta/10 to-transparent p-8 text-center sm:p-12">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
            ¿Tienes un <span className="neon-magenta">logo</span> o una idea
            propia?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Súbenos tu imagen o boceto, dinos el tamaño y nuestro equipo lo
            convierte en un neón único. Te enviamos presupuesto sin compromiso.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <NeonButton href="/diseno-a-medida" color="magenta">
              Enviar mi diseño
            </NeonButton>
            <NeonButton href="/faq" color="cyan" variant="outline">
              Resolver dudas
            </NeonButton>
          </div>
        </div>
      </section>

      {/* ---------------- VENTAJAS + OPINIONES ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-surface p-5">
              <span className="text-2xl" aria-hidden>
                {b.icon}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-text">{b.title}</h3>
              <p className="mt-1 text-xs text-muted">{b.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <TrustpilotRating variant="card" />
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 py-6 text-center">
            <p className="text-sm text-muted">¿Dudas antes de comprar?</p>
            <a
              href="tel:+34627652202"
              className="font-[family-name:var(--font-display)] text-xl font-extrabold text-neon-cyan transition-[text-shadow] hover:[text-shadow:0_0_14px_rgba(41,171,226,0.8)]"
            >
              627 65 22 02
            </a>
            <a
              href="mailto:hola@neonledspain.com"
              className="text-sm text-muted transition-colors hover:text-text"
            >
              hola@neonledspain.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
