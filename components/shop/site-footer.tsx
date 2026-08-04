import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold">
            NEON LED <span className="neon-magenta">SPAIN</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Neones LED decorativos y personalizados, hechos en Mallorca.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-text">Tienda</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/productos" className="hover:text-text">Catálogo</Link></li>
            <li><Link href="/personalizar" className="hover:text-text">Personaliza tu neón</Link></li>
            <li><Link href="/diseno-a-medida" className="hover:text-text">Diseño a medida</Link></li>
            <li><Link href="/faq" className="hover:text-text">Preguntas frecuentes</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-text">Contacto</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><a href="tel:+34627652202" className="hover:text-text">627 65 22 02</a></li>
            <li><a href="mailto:hola@neonledspain.com" className="hover:text-text">hola@neonledspain.com</a></li>
            <li>Marratxí, Mallorca</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Neon Led Spain. Todos los derechos reservados.
      </div>
    </footer>
  );
}
