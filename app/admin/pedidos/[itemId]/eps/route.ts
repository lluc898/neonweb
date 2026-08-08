import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { buildNeonEps } from "@/lib/eps";
import { DEFAULT_CONFIG, type NeonConfig } from "@/lib/neon-options";

/**
 * Descarga del EPS de producción (texto trazado, tamaño real) de una línea
 * de pedido personalizada. Solo para administración autenticada.
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
    include: { order: { select: { number: true } } },
  });

  if (!item || item.kind !== "CUSTOM" || !item.customization) {
    return new NextResponse("Esta línea no tiene diseño personalizado.", { status: 404 });
  }

  const config: NeonConfig = { ...DEFAULT_CONFIG, ...(item.customization as Partial<NeonConfig>) };

  try {
    const eps = await buildNeonEps(config, item.order.number);
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
      "No se ha podido generar el EPS (¿problema al descargar la tipografía?). Inténtalo de nuevo.",
      { status: 500 }
    );
  }
}
