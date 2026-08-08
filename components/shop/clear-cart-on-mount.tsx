"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/**
 * Vacía el carrito al llegar a la confirmación: el pedido ya está registrado
 * en la BD, así que el carrito del navegador ya no debe conservarlo.
 */
export function ClearCartOnMount() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
