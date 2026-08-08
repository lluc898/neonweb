import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { configuratorFontVars } from "@/lib/neon-fonts";
import { SVG_ERROR_MESSAGES, type SvgError } from "@/lib/svg-neon";
import { NewProductForm } from "@/components/admin/new-product-form";
import { createProductAction } from "../../actions";

export const metadata = { title: "Nuevo producto" };

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "El nombre debe tener al menos 2 caracteres.",
  color: "Color no válido.",
  precio: "El precio debe ser mayor que 0.",
  categoria: "Elige una categoría válida.",
};

function errorText(code: string): string {
  if (code.startsWith("svg-")) {
    return SVG_ERROR_MESSAGES[code.slice(4) as SvgError] ?? "El SVG no es válido.";
  }
  return ERROR_MESSAGES[code] ?? "No se pudo crear el producto.";
}

export default async function AdminNuevoProductoPage({
  searchParams,
}: PageProps<"/admin/productos/nuevo">) {
  await requireAdmin();
  const { error } = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: { position: "asc" } });

  return (
    // Las fuentes del configurador: el selector de tipografía las previsualiza.
    <main className={configuratorFontVars}>
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="text-sm text-muted transition-colors hover:text-text"
        >
          ← Volver a productos
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Nuevo producto
        </h1>
        <p className="mt-1 text-sm text-muted">
          Diséñalo con el editor o sube un vectorial. Se publica en el catálogo al
          instante.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-neon-magenta/40 bg-neon-magenta/5 px-4 py-3 text-sm text-neon-magenta">
          {errorText(String(error))}
        </p>
      )}

      <NewProductForm categories={categories} action={createProductAction} />
    </main>
  );
}
