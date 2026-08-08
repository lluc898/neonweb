import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/admin-auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Panel de administración", template: "%s · Admin NLS" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/precios", label: "Precios" },
  { href: "/admin/trustpilot", label: "Opiniones" },
  { href: "/admin/seguridad", label: "Seguridad" },
];

/**
 * Panel independiente: NO comparte header/footer con la tienda.
 * Barra propia con navegación, usuario conectado y logout siempre visible.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const logged = session !== null && !session.pendingTotp;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-neon-cyan/15 px-2 py-1 text-xs font-bold uppercase tracking-wider text-neon-cyan">
              Admin
            </span>
            <span className="hidden text-sm font-semibold text-text sm:block">
              Neon Led Spain
            </span>
          </div>

          {logged && (
            <nav className="flex flex-wrap items-center gap-5">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-[13px] font-medium text-muted transition-colors hover:text-text"
                >
                  {n.label}
                </Link>
              ))}
              {session.user.isSuperadmin && (
                <Link
                  href="/admin/usuarios"
                  className="text-[13px] font-medium text-neon-yellow/80 transition-colors hover:text-neon-yellow"
                >
                  Usuarios
                </Link>
              )}
            </nav>
          )}

          {session && (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted sm:block">
                {session.user.username}
              </span>
              <form action={logoutAction}>
                <button className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-neon-magenta hover:text-neon-magenta">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</div>

      <footer className="border-t border-border py-4 text-center text-xs text-muted">
        Panel interno · acceso restringido
      </footer>
    </div>
  );
}
