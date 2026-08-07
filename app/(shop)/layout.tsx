import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { CartToastHost } from "@/components/shop/cart-toast";

/** Layout de la tienda pública: header, footer y toast del carrito. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <CartToastHost />
    </>
  );
}
