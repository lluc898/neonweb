import type { Metadata } from "next";
import Link from "next/link";
import { NeonConfigurator } from "@/components/neon/neon-configurator";
import { getConfiguratorOptions } from "@/lib/catalog";
import { configuratorFontVars } from "@/lib/neon-fonts";

export const metadata: Metadata = {
  title: "Diseña tu neón personalizado",
  description:
    "Crea tu neón LED a medida: escribe tu texto, elige tipografía, color y tamaño, y ve el resultado en vivo con precio al instante.",
};

// Reglas de precio desde la BD; el admin las refresca con revalidatePath.
export const revalidate = 300;

export default async function PersonalizarPage() {
  const options = await getConfiguratorOptions();
  return (
    <main className={`${configuratorFontVars} mx-auto w-full max-w-6xl flex-1 px-6 py-10`}>
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted transition-colors hover:text-text"
        >
          ← Volver
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
          Diseña tu <span className="neon-cyan">neón</span>
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Escríbelo, dale color y velo cobrar vida al instante. El precio se
          actualiza mientras diseñas.
        </p>
      </header>

      <NeonConfigurator options={options} />
    </main>
  );
}
