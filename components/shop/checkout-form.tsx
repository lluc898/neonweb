"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { cn, neonTextGlow } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";
import { findColor, findSize } from "@/lib/neon-options";
import { PROVINCES } from "@/lib/validators";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeCart,
  type CartItem,
} from "@/lib/cart";
import { createOrderAction, type CheckoutState } from "@/app/(shop)/checkout/actions";

const inputBase =
  "w-full rounded-lg border bg-bg px-4 py-3 text-text outline-none transition-colors placeholder:text-muted/50";

function Field({
  label,
  name,
  error,
  children,
  className,
  hint,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && (
        <span id={`${name}-error`} className="mt-1 block text-xs text-neon-magenta">
          {error}
        </span>
      )}
    </label>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface/50 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-muted">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-text">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubmitButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "h-12 w-full rounded-full text-sm font-semibold transition-all",
        pending
          ? "cursor-wait bg-surface-2 text-muted"
          : "bg-neon-magenta text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] hover:shadow-[0_0_28px_rgba(236,30,140,0.85)]"
      )}
    >
      {pending ? "Procesando…" : `Confirmar pedido · ${formatEUR(total)}`}
    </button>
  );
}

/** Miniatura + nombre de una línea del carrito. */
function SummaryLine({ item }: { item: CartItem }) {
  const isCustom = item.type === "custom";
  const hex = isCustom ? findColor(item.config.colorId).hex : item.color;
  const name = isCustom ? item.config.text.trim() || "Neón personalizado" : item.name;
  const detail = isCustom
    ? `${findSize(item.config.sizeId).label} · ${findColor(item.config.colorId).label}`
    : "Catálogo";

  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bg text-[10px]"
        style={{ color: hex, textShadow: neonTextGlow(hex, 0.8) }}
        aria-hidden
      >
        {name.slice(0, 3)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-text">{name}</span>
        <span className="block truncate text-xs text-muted">{detail}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
        {formatEUR(item.price)}
      </span>
    </li>
  );
}

export function CheckoutForm({
  shippingCostCents,
  freeShippingFromCents,
}: {
  shippingCostCents: number;
  freeShippingFromCents: number;
}) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const [state, formAction] = useActionState<CheckoutState, FormData>(createOrderAction, null);

  const [isCompany, setIsCompany] = useState(false);
  const [differentBilling, setDifferentBilling] = useState(false);

  const errors = state?.errors ?? {};
  const subtotal = items.reduce((sum, it) => sum + it.price, 0);
  const shipping =
    subtotal <= 0 || subtotal * 100 >= freeShippingFromCents ? 0 : shippingCostCents / 100;
  const total = subtotal + shipping;

  // El servidor recalcula todo: solo enviamos la configuración de cada artículo.
  const cartPayload = JSON.stringify(
    items.map((it) =>
      it.type === "custom"
        ? { type: "custom", config: it.config }
        : { type: "product", slug: it.slug, color: it.color, sizeId: it.sizeId }
    )
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-lg text-muted">Tu carrito está vacío.</p>
        <p className="mt-1 text-sm text-muted">Añade algún neón antes de finalizar la compra.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/personalizar"
            className="rounded-full bg-neon-magenta px-6 py-3 text-sm font-semibold text-white shadow-[0_0_16px_rgba(236,30,140,0.5)]"
          >
            Diseña tu neón
          </Link>
          <Link
            href="/productos"
            className="rounded-full border border-border px-6 py-3 text-sm text-text hover:border-neon-cyan"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name] ? "border-neon-magenta" : "border-border focus:border-neon-cyan";

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <input type="hidden" name="cart" value={cartPayload} />

      <div className="space-y-5">
        {/* 1 · Tipo de cliente */}
        <Section n={1} title="¿Quién realiza la compra?">
          <input type="hidden" name="customerType" value={isCompany ? "COMPANY" : "PARTICULAR"} />
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { company: false, label: "Particular", desc: "Compra a nombre propio" },
              { company: true, label: "Empresa", desc: "Con factura y CIF" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setIsCompany(opt.company)}
                aria-pressed={isCompany === opt.company}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  isCompany === opt.company
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-border bg-bg hover:border-muted"
                )}
              >
                <span className="block text-sm font-medium text-text">{opt.label}</span>
                <span className="block text-xs text-muted">{opt.desc}</span>
              </button>
            ))}
          </div>

          {isCompany && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Razón social" name="companyName" error={errors.companyName}>
                <input
                  name="companyName"
                  required={isCompany}
                  autoComplete="organization"
                  className={cn(inputBase, err("companyName"))}
                />
              </Field>
              <Field label="CIF / NIF" name="taxId" error={errors.taxId}>
                <input
                  name="taxId"
                  required={isCompany}
                  placeholder="B12345674"
                  autoCapitalize="characters"
                  className={cn(inputBase, err("taxId"))}
                />
              </Field>
            </div>
          )}
        </Section>

        {/* 2 · Contacto */}
        <Section n={2} title="Datos de contacto">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" name="firstName" error={errors.firstName}>
              <input
                name="firstName"
                required
                autoComplete="given-name"
                className={cn(inputBase, err("firstName"))}
              />
            </Field>
            <Field label="Apellidos" name="lastName" error={errors.lastName}>
              <input
                name="lastName"
                required
                autoComplete="family-name"
                className={cn(inputBase, err("lastName"))}
              />
            </Field>
            <Field label="Email" name="email" error={errors.email} hint="Te enviaremos aquí la confirmación.">
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className={cn(inputBase, err("email"))}
              />
            </Field>
            <Field label="Teléfono" name="phone" error={errors.phone} hint="Para avisos de la entrega.">
              <input
                type="tel"
                name="phone"
                required
                autoComplete="tel"
                placeholder="600 00 00 00"
                className={cn(inputBase, err("phone"))}
              />
            </Field>
            {!isCompany && (
              <Field
                label="NIF / NIE (opcional)"
                name="taxId"
                error={errors.taxId}
                className="sm:col-span-2"
                hint="Solo si necesitas factura a tu nombre."
              >
                <input
                  name="taxId"
                  autoCapitalize="characters"
                  placeholder="12345678Z"
                  className={cn(inputBase, err("taxId"))}
                />
              </Field>
            )}
          </div>
        </Section>

        {/* 3 · Envío */}
        <Section n={3} title="Dirección de envío">
          <div className="grid gap-3 sm:grid-cols-6">
            <Field label="Dirección" name="street" error={errors.street} className="sm:col-span-4">
              <input
                name="street"
                required
                autoComplete="address-line1"
                placeholder="Calle y número"
                className={cn(inputBase, err("street"))}
              />
            </Field>
            <Field label="Piso / puerta" name="extra" className="sm:col-span-2">
              <input
                name="extra"
                autoComplete="address-line2"
                placeholder="Opcional"
                className={cn(inputBase, "border-border focus:border-neon-cyan")}
              />
            </Field>
            <Field label="Código postal" name="postalCode" error={errors.postalCode} className="sm:col-span-2">
              <input
                name="postalCode"
                required
                inputMode="numeric"
                maxLength={5}
                autoComplete="postal-code"
                placeholder="07141"
                className={cn(inputBase, err("postalCode"))}
              />
            </Field>
            <Field label="Localidad" name="city" error={errors.city} className="sm:col-span-2">
              <input
                name="city"
                required
                autoComplete="address-level2"
                className={cn(inputBase, err("city"))}
              />
            </Field>
            <Field label="Provincia" name="province" error={errors.province} className="sm:col-span-2">
              <select
                name="province"
                required
                defaultValue=""
                className={cn(inputBase, err("province"))}
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              name="differentBilling"
              checked={differentBilling}
              onChange={(e) => setDifferentBilling(e.target.checked)}
              className="h-4 w-4 accent-[#29abe2]"
            />
            La dirección de facturación es diferente
          </label>

          {differentBilling && (
            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-6">
              <Field label="Dirección" name="billingStreet" error={errors.billingStreet} className="sm:col-span-4">
                <input name="billingStreet" required={differentBilling} className={cn(inputBase, err("billingStreet"))} />
              </Field>
              <Field label="Piso / puerta" name="billingExtra" className="sm:col-span-2">
                <input name="billingExtra" className={cn(inputBase, "border-border focus:border-neon-cyan")} />
              </Field>
              <Field label="Código postal" name="billingPostalCode" error={errors.billingPostalCode} className="sm:col-span-2">
                <input
                  name="billingPostalCode"
                  required={differentBilling}
                  inputMode="numeric"
                  maxLength={5}
                  className={cn(inputBase, err("billingPostalCode"))}
                />
              </Field>
              <Field label="Localidad" name="billingCity" error={errors.billingCity} className="sm:col-span-2">
                <input name="billingCity" required={differentBilling} className={cn(inputBase, err("billingCity"))} />
              </Field>
              <Field label="Provincia" name="billingProvince" error={errors.billingProvince} className="sm:col-span-2">
                <select name="billingProvince" required={differentBilling} defaultValue="" className={cn(inputBase, err("billingProvince"))}>
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </Section>

        {/* 4 · Notas */}
        <Section n={4} title="Notas del pedido (opcional)">
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            placeholder="¿Alguna indicación para la entrega o para el diseño?"
            className={cn(inputBase, "resize-none border-border focus:border-neon-cyan")}
          />
        </Section>
      </div>

      {/* Resumen */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Tu pedido
          </h2>

          <ul className="mt-4 space-y-3">
            {items.map((it, i) => (
              <SummaryLine key={`${it.addedAt}-${i}`} item={it} />
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd className="tabular-nums text-text">{formatEUR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Envío</dt>
              <dd className="tabular-nums text-text">
                {shipping === 0 ? "Gratis" : formatEUR(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-text">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatEUR(total)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-xs text-muted">IVA incluido.</p>

          {shipping > 0 && (
            <p className="mt-2 rounded-lg bg-neon-cyan/5 px-3 py-2 text-xs text-neon-cyan">
              Te faltan {formatEUR(freeShippingFromCents / 100 - subtotal)} para el envío gratis.
            </p>
          )}

          <label className="mt-4 flex items-start gap-2.5 text-xs text-muted">
            <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 accent-[#ec1e8c]" />
            <span>
              He leído y acepto las condiciones de compra y la política de privacidad.
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-neon-magenta">{errors.terms}</p>}

          <div className="mt-4">
            <SubmitButton total={total} />
          </div>

          {state?.message && (
            <p className="mt-3 rounded-lg border border-neon-magenta/40 bg-neon-magenta/5 px-3 py-2 text-xs text-neon-magenta">
              {state.message}
            </p>
          )}

          <p className="mt-3 text-center text-xs text-muted">
            El pago se habilitará próximamente. De momento registramos tu pedido y te
            contactamos para confirmarlo.
          </p>
        </div>

        <Link
          href="/carrito"
          className="block text-center text-xs text-muted transition-colors hover:text-text"
        >
          ← Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
