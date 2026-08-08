import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/pricing";
import { ClearCartOnMount } from "@/components/shop/clear-cart-on-mount";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

type Address = {
  street?: string;
  extra?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
};

const fmtDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" });

export default async function OrderConfirmationPage({
  params,
}: PageProps<"/pedido/[numero]">) {
  const { numero } = await params;
  const order = await prisma.order.findUnique({
    where: { number: numero },
    include: { items: true },
  });
  if (!order) notFound();

  const shipping = (order.shippingAddress ?? {}) as Address;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      {/* El pedido ya está registrado: vaciamos el carrito del navegador. */}
      <ClearCartOnMount />

      <div className="rounded-2xl border border-neon-cyan/40 bg-neon-cyan/5 p-8 text-center">
        <p className="text-3xl" aria-hidden>
          ✨
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold text-text">
          ¡Pedido confirmado!
        </h1>
        <p className="mt-2 text-muted">
          Gracias {order.firstName}. Hemos recibido tu pedido y te escribiremos a{" "}
          <span className="text-text">{order.customerEmail}</span> para confirmarlo.
        </p>
        <p className="mt-4 inline-block rounded-full border border-border bg-bg px-4 py-2 text-sm">
          Referencia:{" "}
          <span className="font-bold tracking-wide text-neon-cyan">{order.number}</span>
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Resumen del pedido
        </h2>
        <p className="mt-1 text-xs text-muted">{fmtDate.format(order.createdAt)}</p>

        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-text">
                {item.quantity > 1 && `${item.quantity}× `}
                {item.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {formatEUR(item.priceCents / 100)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Subtotal</dt>
            <dd className="tabular-nums text-text">{formatEUR(order.subtotalCents / 100)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Envío</dt>
            <dd className="tabular-nums text-text">
              {order.shippingCents === 0 ? "Gratis" : formatEUR(order.shippingCents / 100)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-text">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatEUR(order.totalCents / 100)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Envío a
          </h2>
          <p className="text-text">
            {order.companyName ? `${order.companyName} · ` : ""}
            {order.firstName} {order.lastName}
          </p>
          <p className="mt-1 text-muted">
            {shipping.street}
            {shipping.extra ? `, ${shipping.extra}` : ""}
            <br />
            {shipping.postalCode} {shipping.city} ({shipping.province})
            <br />
            {shipping.country}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Qué pasa ahora
          </h2>
          <ol className="list-decimal space-y-1.5 pl-4 text-muted">
            <li>Revisamos tu diseño y te confirmamos por email.</li>
            <li>Fabricamos tu neón a mano.</li>
            <li>Te avisamos al enviarlo.</li>
          </ol>
        </div>
      </section>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/productos"
          className="rounded-full border border-border px-6 py-3 text-center text-sm text-text hover:border-neon-cyan"
        >
          Seguir explorando
        </Link>
        <a
          href={`mailto:hola@neonledspain.com?subject=Pedido ${order.number}`}
          className="rounded-full border border-border px-6 py-3 text-center text-sm text-text hover:border-neon-cyan"
        >
          Contactar sobre este pedido
        </a>
      </div>
    </main>
  );
}
