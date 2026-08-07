import type { Metadata } from "next";
import Link from "next/link";
import { CustomRequestForm } from "@/components/shop/custom-request-form";

export const metadata: Metadata = {
  title: "Diseño a medida",
  description:
    "¿Tienes un logo o una idea? Súbenos tu imagen, dinos el tamaño y te enviamos presupuesto para tu neón LED totalmente a medida.",
};

const ERROR_MESSAGES: Record<string, string> = {
  campos: "Faltan campos obligatorios (nombre, email y tamaño).",
  email: "El email no parece válido. Revísalo, por favor.",
  formato: "Formato de imagen no admitido. Usa PNG, JPG, WEBP o SVG.",
  peso: "La imagen supera los 6 MB. Reduce su tamaño e inténtalo de nuevo.",
  subida: "No se pudo subir la imagen. Inténtalo de nuevo en unos minutos.",
};

export default async function DisenoAMedidaPage({
  searchParams,
}: PageProps<"/diseno-a-medida">) {
  const { ok, error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <header className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
          Diseño <span className="neon-magenta">a medida</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          ¿Tienes un logo, un boceto o una idea que va más allá del texto? Sube tu
          imagen, dinos el tamaño y nuestro equipo lo convierte en un neón único.
        </p>
      </header>

      {ok ? (
        <div className="mt-10 rounded-2xl border border-neon-cyan/50 bg-neon-cyan/5 p-8 text-center">
          <p className="text-2xl">✨</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-text">
            ¡Solicitud recibida!
          </h2>
          <p className="mt-2 text-muted">
            Ya la tenemos. Te enviaremos el presupuesto a tu email en 24-48 h
            laborables.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/productos"
              className="rounded-full border border-border px-6 py-3 text-sm text-text hover:border-neon-cyan"
            >
              Ver catálogo mientras tanto
            </Link>
            <Link
              href="/diseno-a-medida"
              className="rounded-full border border-border px-6 py-3 text-sm text-muted hover:text-text"
            >
              Enviar otra solicitud
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10">
          {error && (
            <div className="mb-6 rounded-xl border border-neon-magenta/50 bg-neon-magenta/5 p-4 text-sm text-neon-magenta">
              {ERROR_MESSAGES[String(error)] ?? "Algo ha fallado. Inténtalo de nuevo."}
            </div>
          )}
          <CustomRequestForm />
        </div>
      )}
    </main>
  );
}
