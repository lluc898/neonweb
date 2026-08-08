import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { buildNeonEps, buildVectorEps, type EpsResult } from "@/lib/eps";
import { DEFAULT_CONFIG, NEON_FONTS, type NeonConfig } from "@/lib/neon-options";

/**
 * Descarga del EPS de producción (curvas, tamaño real) de una línea de pedido.
 * Sirve para las tres formas de diseño:
 *   - personalizado del configurador  → texto trazado con su tipografía
 *   - producto de catálogo vectorial  → los trazos del SVG
 *   - producto de catálogo con fuente → texto trazado, como el personalizado
 * Solo para administración autenticada.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  if (!(await isAdmin())) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { itemId } = await params;
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      order: { select: { number: true } },
      product: {
        select: { name: true, design: true, designText: true, fontId: true, svgMarkup: true },
      },
    },
  });

  if (!item || !item.customization) {
    return new NextResponse("Esta línea no tiene diseño descargable.", { status: 404 });
  }

  const config: NeonConfig = { ...DEFAULT_CONFIG, ...(item.customization as Partial<NeonConfig>) };

  try {
    let eps: EpsResult;

    if (item.kind === "PRODUCT" && item.product) {
      const p = item.product;

      if (p.design === "SVG" && p.svgMarkup) {
        eps = buildVectorEps(p.svgMarkup, p.name, config, item.order.number);
      } else {
        // Producto de catálogo diseñado con tipografía: mismo EPS que un
        // personalizado, pero con el texto y la fuente que guardó el producto.
        const fontId = NEON_FONTS.some((f) => f.id === p.fontId)
          ? (p.fontId as string)
          : config.fontId;
        eps = await buildNeonEps(
          { ...config, text: p.designText?.trim() || p.name, fontId },
          item.order.number
        );
      }
    } else if (item.kind === "PRODUCT") {
      // El producto se borró del catálogo: ya no hay diseño que exportar.
      return new NextResponse(
        "El producto de esta línea ya no está en el catálogo, así que no se puede regenerar su EPS.",
        { status: 404 }
      );
    } else {
      eps = await buildNeonEps(config, item.order.number);
    }

    return new NextResponse(eps.content, {
      headers: {
        "Content-Type": "application/postscript",
        "Content-Disposition": `attachment; filename="${eps.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando el EPS:", error);
    return new NextResponse(
      "No se ha podido generar el EPS. Revisa el diseño del producto e inténtalo de nuevo.",
      { status: 500 }
    );
  }
}
