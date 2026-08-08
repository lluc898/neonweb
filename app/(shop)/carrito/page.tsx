import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";
import { configuratorFontVars } from "@/lib/neon-fonts";
import { getProductArtworks } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Carrito",
};

export default async function CarritoPage() {
  // El carrito solo guarda nombre y color de cada producto, así que los
  // diseños (SVG, tipografía, emoji) se traen aquí y se pasan al cliente.
  const artworks = await getProductArtworks();

  // Las fuentes del configurador para poder previsualizar cada neón del carrito.
  return (
    <main className={`${configuratorFontVars} mx-auto w-full max-w-6xl flex-1 px-6 py-10`}>
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
        Tu carrito
      </h1>
      <CartView artworks={artworks} />
    </main>
  );
}
