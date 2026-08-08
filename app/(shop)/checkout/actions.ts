"use server";

import { redirect } from "next/navigation";
import { submitOrder } from "@/lib/checkout";

export type CheckoutState = {
  ok: false;
  errors: Record<string, string>;
  message?: string;
} | null;

/**
 * Envoltorio de `submitOrder` para el formulario: registra el pedido y lleva a
 * la confirmación, o devuelve los errores para pintarlos en el formulario.
 */
export async function createOrderAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const result = await submitOrder(formData);
  if (result.ok) redirect(`/pedido/${result.number}`);
  return { ok: false, errors: result.errors, message: result.message };
}
