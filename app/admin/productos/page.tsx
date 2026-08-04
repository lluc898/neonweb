import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { neonTextGlow } from "@/lib/utils";
import { updateProductAction } from "../actions";

export default async function AdminProductosPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
  });

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Productos
        </h1>
        <span className="text-sm text-muted">{products.length} en total</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio base (€)</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-bg text-xs"
                      style={
                        p.symbol
                          ? { filter: `drop-shadow(0 0 6px ${p.color})` }
                          : { color: p.color, textShadow: neonTextGlow(p.color, 0.7) }
                      }
                    >
                      {p.symbol ?? "Aa"}
                    </span>
                    <span className="font-medium text-text">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.category.label}</td>
                <td className="px-4 py-3" colSpan={3}>
                  <form action={updateProductAction} className="flex items-center gap-4">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="number"
                      name="price"
                      min={0}
                      step="1"
                      defaultValue={Math.round(p.priceCents / 100)}
                      className="w-24 rounded-md border border-border bg-bg px-3 py-1.5 text-text outline-none focus:border-neon-cyan"
                    />
                    <label className="flex items-center gap-2 text-muted">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={p.active}
                        className="h-4 w-4 accent-[#29abe2]"
                      />
                      visible
                    </label>
                    <button className="rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                      Guardar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Los cambios se publican al instante en la tienda (catálogo y fichas).
      </p>
    </main>
  );
}
