import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Plazos, instalación, garantía y personalización de tus neones LED. Resolvemos tus dudas.",
};

// Contenido base — el propietario debe revisar/ajustar plazos, garantía y políticas.
const FAQS = [
  {
    q: "¿Cuánto tarda en llegar mi neón?",
    a: "Cada neón se fabrica a mano bajo pedido. El plazo habitual es de 7 a 10 días laborables de fabricación, más el tiempo de envío.",
  },
  {
    q: "¿Consumen mucha electricidad?",
    a: "No. Nuestros neones son LED de bajo consumo: gastan mucho menos que el neón de gas tradicional y apenas se calientan.",
  },
  {
    q: "¿Puedo usarlo en el exterior?",
    a: "Sí, ofrecemos acabado resistente al agua (IP65) para terrazas y fachadas. Selecciónalo en la opción de uso al personalizar.",
  },
  {
    q: "¿Cómo se instala?",
    a: "Llega listo para colgar: incluye los soportes y el transformador. Solo tienes que enchufarlo. Muchos modelos incluyen mando para regular el brillo.",
  },
  {
    q: "¿Puedo diseñar mi propio neón?",
    a: "¡Claro! Usa nuestro configurador para crear tu texto en vivo, o envíanos tu propia imagen o logo y lo diseñamos por ti.",
  },
  {
    q: "¿Tienen garantía?",
    a: "Sí, todos nuestros neones incluyen garantía. Si tienes cualquier incidencia, contáctanos y te ayudamos.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
        Preguntas <span className="neon-cyan">frecuentes</span>
      </h1>
      <p className="mt-2 text-muted">Todo lo que necesitas saber antes de comprar.</p>

      <div className="mt-8 space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-border bg-surface p-5 [&_summary]:cursor-pointer"
          >
            <summary className="flex items-center justify-between font-semibold text-text marker:content-['']">
              {f.q}
              <span className="text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-muted">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-surface/60 p-6 text-center">
        <p className="text-text">¿Tienes otra duda?</p>
        <a
          href="mailto:hola@neonledspain.com"
          className="mt-2 inline-block text-neon-cyan hover:underline"
        >
          Escríbenos a hola@neonledspain.com
        </a>
      </div>
    </main>
  );
}
