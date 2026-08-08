/**
 * Lectura de los ajustes de tienda (`SiteSetting`). Solo servidor.
 * Mismo criterio que `lib/catalog.ts`: si la BD falla o la clave no existe,
 * se devuelve el valor por defecto del código en vez de romper la página.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  TRUSTPILOT_DEFAULT,
  TRUSTPILOT_SETTING_KEY,
  parseTrustpilot,
  type TrustpilotData,
} from "@/lib/trustpilot";

/** `cache` dedupe la consulta entre el footer y la página dentro del mismo render. */
export const getTrustpilot = cache(async (): Promise<TrustpilotData> => {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: TRUSTPILOT_SETTING_KEY },
    });
    if (!row) return TRUSTPILOT_DEFAULT;
    return parseTrustpilot(row.value);
  } catch {
    return TRUSTPILOT_DEFAULT;
  }
});
