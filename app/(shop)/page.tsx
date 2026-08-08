import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { NeonConfigurator } from "@/components/neon/neon-configurator";
import { NeonText } from "@/components/neon/neon-text";
import { NeonButton } from "@/components/neon/neon-button";
import { ProductSlider } from "@/components/shop/product-slider";
import { HeroSlider } from "@/components/shop/hero-slider";
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
      {/* ---------------- HERO con carrusel de fotografías ---------------- */}
      <HeroSlider>
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.webp"
            alt="Neon Led Spain"
            width={200}
            height={192}
            priority
            className="mb-6 h-auto w-28 drop-shadow-[0_0_25px_rgba(41,171,226,0.45)] sm:w-36"
          />

          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-muted">
            Neones LED · Hechos a mano en Mallorca
          </p>

          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.1] drop-shadow-[0_2px_18px_rgba(0,0,0,0.85)] sm:text-6xl">
            Ilumina lo tuyo con un{" "}
            <NeonText color="cyan" flicker>
              neón
            </NeonText>{" "}
            hecho a <NeonText color="magenta">medida</NeonText>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-text/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            Escríbelo abajo y velo cobrar vida al instante, con su precio en
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

          {/* Señales de confianza */}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <li>✓ Fabricación en 3-5 días</li>
            <li>✓ Envío gratis desde {formatEUR(shipping.freeFromCents / 100)}</li>
            <li>✓ Diseño confirmado antes de fabricar</li>
          </ul>
        </div>
      </HeroSlider>

      {/* ---------------- CONFIGURADOR (la joya, en portada) ---------------- */}
      <section id="configurador" className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
            Diseña tu neón <span className="neon-cyan">aquí mismo</span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            Cambia el texto, la tipografía y el color: la vista previa y el
            precio se actualizan al momento.
          </p>
        </div>

        <NeonConfigurator options={options} />
      </section>

      {/* ---------------- CATÁLOGO (slider) ---------------- */}
      <section className="border-y border-border bg-surface/30 py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
                ¿Prefieres un diseño listo?
              </h2>
              <p className="mt-1 text-muted">
                Nuestros neones más pedidos, disponibles en el color que quieras.
              </p>
            </div>
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
        <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
          Así de fácil
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-surface p-6">
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
        <h2 className="mb-6 text-center font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
          Para cada ocasión
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
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

      {/* ---------------- VENTAJAS ---------------- */}
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

        <p className="mt-8 text-center text-sm text-muted">
          ¿Dudas antes de comprar?{" "}
          <a href="tel:+34627652202" className="text-neon-cyan hover:underline">
            627 65 22 02
          </a>{" "}
          ·{" "}
          <a href="mailto:hola@neonledspain.com" className="text-neon-cyan hover:underline">
            hola@neonledspain.com
          </a>
        </p>
      </section>
    </main>
  );
}
