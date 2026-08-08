import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getShippingRates } from "@/lib/order-pricing";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const rates = await getShippingRates();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
          Finalizar <span className="neon-cyan">compra</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Revisa tu pedido y completa tus datos. Fabricamos cada neón a mano en Mallorca.
        </p>
      </header>

      <CheckoutForm
        shippingCostCents={rates.costCents}
        freeShippingFromCents={rates.freeFromCents}
      />
    </main>
  );
}
