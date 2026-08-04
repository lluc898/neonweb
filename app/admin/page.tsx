import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatEUR } from "@/lib/pricing";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [newOrders, inProduction, products, requests, revenue] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.customRequest.count({ where: { status: "NEW" } }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { notIn: ["CANCELLED"] } },
    }),
  ]);

  const cards = [
    { label: "Pedidos nuevos", value: newOrders, href: "/admin/pedidos", accent: "text-neon-magenta" },
    { label: "En producción", value: inProduction, href: "/admin/pedidos", accent: "text-neon-cyan" },
    { label: "Solicitudes a medida", value: requests, href: "/admin/solicitudes", accent: "text-neon-yellow" },
    { label: "Productos activos", value: products, href: "/admin/productos", accent: "text-text" },
  ];

  return (
    <main>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Resumen
      </h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-neon-cyan/60"
          >
            <span className={`block text-3xl font-bold ${c.accent}`}>{c.value}</span>
            <span className="mt-1 block text-sm text-muted">{c.label}</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <span className="block text-3xl font-bold text-text">
          {formatEUR((revenue._sum.totalCents ?? 0) / 100)}
        </span>
        <span className="mt-1 block text-sm text-muted">
          Facturación total (pedidos no cancelados)
        </span>
      </div>
    </main>
  );
}
