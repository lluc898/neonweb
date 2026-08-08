"use client";

import type { NeonConfig } from "@/lib/neon-options";
import type { PriceBreakdown, ProductPriceBreakdown } from "@/lib/pricing";

/**
 * Carrito v1 en localStorage (clave `neon_cart`).
 * Única fuente de verdad de lectura/escritura: emite eventos para que la UI
 * reaccione (`cart-updated` → contador del header; `cart-added` → toast).
 */

export type CartItem =
  | {
      type: "custom";
      config: NeonConfig;
      price: number;
      /**
       * Desglose completo tal como se lo mostramos al cliente al añadirlo
       * (incluye metros de tubo, m², potencia y multiplicadores).
       * El precio real se revalida en servidor antes de cobrar.
       */
      breakdown?: PriceBreakdown;
      addedAt: number;
    }
  | {
      type: "product";
      slug: string;
      name: string;
      /** Hex del color elegido (para pintar la preview del carrito). */
      color: string;
      sizeId: string;
      price: number;
      addedAt: number;
      /**
       * Opciones añadidas en la v2 de la ficha de producto. Son opcionales
       * porque los carritos guardados antes no las traen: quien las lea debe
       * caer a los valores por defecto (`DEFAULT_PRODUCT_OPTIONS`).
       */
      colorId?: string;
      supportId?: string;
      usageId?: string;
      breakdown?: ProductPriceBreakdown;
    };

const KEY = "neon_cart";

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

// --- Suscripción para useSyncExternalStore (carrito = almacén externo) ---

const EMPTY: CartItem[] = [];
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

/** Snapshot estable: solo re-parsea si el JSON guardado cambió. */
export function getCartSnapshot(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedItems = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }
  return cachedItems;
}

/** En servidor no hay carrito: siempre vacío (evita desajustes de hidratación). */
export function getCartServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeCart(onChange: () => void): () => void {
  window.addEventListener("cart-updated", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("cart-updated", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function persist(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

/**
 * Un artículo tal como lo pasa quien lo añade: sin `addedAt`, que lo pone
 * `addToCart`. Distributivo para que respete las dos variantes de la unión.
 */
export type NewCartItem = CartItem extends infer T
  ? T extends CartItem
    ? Omit<T, "addedAt">
    : never
  : never;

/**
 * Añade un artículo y notifica a la UI (badge + toast con el nombre).
 * La marca de tiempo se sella aquí: el llamante no puede olvidarla, y así
 * los componentes no llaman a `Date.now()` durante el render.
 */
export function addToCart(item: NewCartItem, label: string) {
  persist([...readCart(), { ...item, addedAt: Date.now() } as CartItem]);
  window.dispatchEvent(new CustomEvent("cart-added", { detail: { label } }));
}

export function removeFromCart(index: number): void {
  persist(readCart().filter((_, i) => i !== index));
}

/** Vacía el carrito (tras registrar el pedido). */
export function clearCart(): void {
  persist([]);
}
