import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { configuratorFontVars } from "@/lib/neon-fonts";
import { ProductArtwork } from "@/components/shop/product-artwork";
import { NeonStage } from "@/components/shop/neon-stage";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { deleteProductAction, updateProductAction } from "../actions";

export const metadata = { title: "Productos" };

export default async function AdminProductosPage({
  searchParams,
}: PageProps<"/admin/productos">) {
  await requireAdmin();
  const { ok, error, n, slug } = await searchParams;

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
  });

  return (
    // Fuentes del configurador: las miniaturas pueden usar una tipografía.
    <main className={configuratorFontVars}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
            Productos
          </h1>
          <p className="mt-1 text-sm text-muted">{products.length} en el catálogo</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-full bg-neon-magenta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(236,30,140,0.45)] transition-shadow hover:shadow-[0_0_26px_rgba(236,30,140,0.8)]"
        >
          + Nuevo producto
        </Link>
      </div>

      {ok === "creado" && (
        <p className="mb-5 rounded-lg border border-neon-cyan/40 bg-neon-cyan/5 px-4 py-3 text-sm text-neon-cyan">
          ✓ Producto creado.{" "}
          {slug && (
            <Link href={`/productos/${slug}`} className="underline">
              Ver la ficha en la tienda →
            </Link>
          )}
        </p>
      )}
      {ok === "borrado" && (
        <p className="mb-5 rounded-lg border border-neon-cyan/40 bg-neon-cyan/5 px-4 py-3 text-sm text-neon-cyan">
          ✓ Producto eliminado del catálogo.
        </p>
      )}
      {error === "en-pedidos" && (
        <p className="mb-5 rounded-lg border border-neon-yellow/40 bg-neon-yellow/5 px-4 py-3 text-sm text-neon-yellow">
          No se puede eliminar: aparece en {n} línea{Number(n) === 1 ? "" : "s"} de pedido y se
          perdería la trazabilidad de lo vendido. Desmarca <strong>visible</strong> para
          retirarlo de la tienda conservando el histórico.
        </p>
      )}
      {error === "no-existe" && (
        <p className="mb-5 rounded-lg border border-neon-magenta/40 bg-neon-magenta/5 px-4 py-3 text-sm text-neon-magenta">
          Ese producto ya no existe.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio base (€) · visibilidad</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <NeonStage color={p.color} className="h-12 w-16 shrink-0 rounded-md">
                      <ProductArtwork
                        product={{
                          name: p.name,
                          color: p.color,
                          design: p.design === "SVG" ? "SVG" : "TEXT",
                          designText: p.designText ?? undefined,
                          fontId: p.fontId ?? undefined,
                          symbol: p.symbol ?? undefined,
                          svgMarkup: p.svgMarkup ?? undefined,
                          svgStroke: p.svgStroke ?? undefined,
                        }}
                        sizeRem={0.75}
                      />
                    </NeonStage>
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-text">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {p.design === "SVG" ? "vectorial" : p.symbol ? "emoji" : "texto"}
                        {p.sourceFileUrl && (
                          <>
                            {" · "}
                            <a
                              href={`${p.sourceFileUrl}?download=`}
                              className="text-neon-cyan hover:underline"
                            >
                              archivo de taller
                            </a>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.category.label}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-right">
                  <form action={deleteProductAction}>
                    <DeleteProductButton id={p.id} name={p.name} />
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
