import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
};

export default function CarritoPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
        Tu carrito
      </h1>
      <CartView />
    </main>
  );
}
