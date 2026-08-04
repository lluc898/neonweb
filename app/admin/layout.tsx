import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/precios", label: "Precios" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const logged = await isAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-neon-cyan/15 px-2 py-1 text-xs font-bold uppercase tracking-wider text-neon-cyan">
            Admin
          </span>
          <span className="text-sm text-muted">Panel de gestión</span>
        </div>
        {logged && (
          <nav className="flex flex-wrap items-center gap-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-sm text-muted transition-colors hover:text-text"
              >
                {n.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button className="text-sm text-neon-magenta hover:underline">Salir</button>
            </form>
          </nav>
        )}
      </div>
      {children}
    </div>
  );
}
