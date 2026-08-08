"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { cn, neonTextGlow } from "@/lib/utils";
import { calcPrice, formatEUR, type PriceBreakdown } from "@/lib/pricing";
import {
  findColor,
  findDelivery,
  findFont,
  findSize,
  findSupport,
  findUsage,
  NEON_COLORS,
  type NeonConfig,
} from "@/lib/neon-options";
import { PRODUCT_SIZES } from "@/lib/products";
import { NeonStage } from "@/components/shop/neon-stage";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  removeFromCart,
  subscribeCart,
  type CartItem,
} from "@/lib/cart";

const num = (n: number) => n.toLocaleString("es-ES");

/** Par etiqueta/valor de la ficha del producto. */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="truncate text-sm text-text" title={value}>
        {value}
      </dd>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "flex justify-between gap-4",
        strong && "font-semibold text-text",
        className
      )}
    >
      <span>{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </li>
  );
}

/** Desglose de precio desplegable. */
function PriceBreakdownDetails({
  b,
  usageLabel,
  deliveryLabel,
}: {
  b: PriceBreakdown;
  usageLabel: string;
  deliveryLabel: string;
}) {
  return (
    <details className="group mt-3 rounded-lg border border-border/70 bg-bg/40">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-neon-cyan">
        <span className="transition-transform group-open:rotate-90" aria-hidden>
          ▸
        </span>
        Ver desglose del precio
      </summary>
      <ul className="space-y-1 border-t border-border/70 px-3 py-2.5 text-xs text-muted">
        {b.tubeCost > 0 && (
          <BreakdownRow
            label={`Tubo de neón · ${num(b.tubeM)} m`}
            value={formatEUR(b.tubeCost)}
          />
        )}
        {b.materialCost > 0 && (
          <BreakdownRow
            label={`Material acrílico · ${num(b.areaM2)} m²`}
            value={formatEUR(b.materialCost)}
          />
        )}
        {b.rgbExtra > 0 && (
          <BreakdownRow label="RGB multicolor (con mando)" value={`+${formatEUR(b.rgbExtra)}`} />
        )}
        {b.support > 0 && <BreakdownRow label="Soporte" value={`+${formatEUR(b.support)}`} />}
        {b.usageMultiplier !== 1 && (
          <BreakdownRow label={usageLabel} value={`× ${num(b.usageMultiplier)}`} />
        )}
        {b.deliveryMultiplier !== 1 && (
          <BreakdownRow
            label={`Entrega ${deliveryLabel.toLowerCase()}`}
            value={`× ${num(b.deliveryMultiplier)}`}
          />
        )}
        {b.minApplied && (
          <BreakdownRow label="Pedido mínimo aplicado" value={formatEUR(b.total)} />
        )}
        <BreakdownRow
          label="Total (IVA incl.)"
          value={formatEUR(b.total)}
          strong
          className="mt-1.5 border-t border-border/70 pt-1.5"
        />
      </ul>
    </details>
  );
}

/** Ficha completa de un neón personalizado. */
function CustomItemCard({
  config,
  price,
  breakdown,
  onRemove,
}: {
  config: NeonConfig;
  price: number;
  breakdown?: PriceBreakdown;
  onRemove: () => void;
}) {
  const font = findFont(config.fontId);
  const color = findColor(config.colorId);
  const size = findSize(config.sizeId);
  const support = findSupport(config.supportId);
  const usage = findUsage(config.usageId);
  const delivery = findDelivery(config.deliveryId);

  // Carritos antiguos pueden no traer desglose: se recalcula con las tarifas por defecto.
  const b = breakdown ?? calcPrice(config);
  const label = config.text.trim() || "Neón personalizado";

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        {/* Vista previa real del diseño */}
        <NeonStage color={color.hex} className="h-28 w-full shrink-0 rounded-lg sm:w-40">
          <span
            className={cn("block max-w-[140px] truncate text-center", color.rgb && "animate-rgb")}
            style={{
              fontFamily: font.cssVar,
              fontSize: `${1.35 * font.scale}rem`,
              color: color.hex,
              textShadow: neonTextGlow(color.hex, 0.85),
            }}
          >
            {label}
          </span>
        </NeonStage>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-text">“{label}”</h3>
              <p className="text-xs uppercase tracking-wider text-muted">
                Neón personalizado
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-lg font-bold text-text">{formatEUR(price)}</span>
              <button
                onClick={onRemove}
                aria-label={`Quitar ${label} del carrito`}
                className="text-muted transition-colors hover:text-neon-magenta"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Ficha de personalización */}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            <Spec label="Tipografía" value={font.label} />
            <Spec label="Color" value={color.label} />
            <Spec label="Tamaño" value={`${size.label} · ${size.dimension}`} />
            <Spec label="Soporte" value={support.label} />
            <Spec label="Uso" value={usage.label} />
            <Spec label="Entrega" value={`${delivery.label} · ${delivery.eta}`} />
          </dl>

          {/* Ficha técnica de fabricación */}
          <p className="mt-3 border-t border-border/70 pt-2.5 text-xs text-muted">
            <span className="font-medium text-text">Ficha técnica:</span> {num(b.tubeM)} m de
            tubo · {num(b.areaM2)} m² de acrílico · {b.watts} W · transformador y fijaciones
            incluidos
          </p>

          <PriceBreakdownDetails
            b={b}
            usageLabel={usage.label}
            deliveryLabel={delivery.label}
          />
        </div>
      </div>
    </li>
  );
}

/** Ficha de un producto de catálogo. */
function ProductItemCard({
  item,
  onRemove,
}: {
  item: Extract<CartItem, { type: "product" }>;
  onRemove: () => void;
}) {
  const colorName =
    NEON_COLORS.find((c) => c.hex.toLowerCase() === item.color.toLowerCase())?.label ?? "Personalizado";
  const size = PRODUCT_SIZES.find((s) => s.id === item.sizeId);

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <NeonStage color={item.color} className="h-28 w-full shrink-0 rounded-lg sm:w-40">
          <span
            className="block max-w-[140px] truncate text-center font-[family-name:var(--font-script)] text-xl"
            style={{ color: item.color, textShadow: neonTextGlow(item.color, 0.85) }}
          >
            {item.name}
          </span>
        </NeonStage>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-text">{item.name}</h3>
              <p className="text-xs uppercase tracking-wider text-muted">Catálogo</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-lg font-bold text-text">{formatEUR(item.price)}</span>
              <button
                onClick={onRemove}
                aria-label={`Quitar ${item.name} del carrito`}
                className="text-muted transition-colors hover:text-neon-magenta"
              >
                ✕
              </button>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            <Spec label="Color" value={colorName} />
            {size && <Spec label="Tamaño" value={`${size.label} · ${size.dimension}`} />}
            <Spec label="Uso" value="Interior" />
          </dl>

          <p className="mt-3 border-t border-border/70 pt-2.5 text-xs text-muted">
            <span className="font-medium text-text">Incluye:</span> transformador, fijaciones y
            manual de montaje.
          </p>

          <Link
            href={`/productos/${item.slug}`}
            className="mt-2 inline-block text-xs text-neon-cyan hover:underline"
          >
            Ver ficha del producto →
          </Link>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  // El carrito vive en localStorage: almacén externo a React.
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);

  const total = items.reduce((sum, it) => sum + it.price, 0);
  const hasExpress = items.some(
    (it) => it.type === "custom" && it.config.deliveryId === "express"
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-lg text-muted">Tu carrito está vacío.</p>
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {items.map((it, i) =>
          it.type === "custom" ? (
            <CustomItemCard
              key={`${it.addedAt}-${i}`}
              config={it.config}
              price={it.price}
              breakdown={it.breakdown}
              onRemove={() => removeFromCart(i)}
            />
          ) : (
            <ProductItemCard key={`${it.addedAt}-${i}`} item={it} onRemove={() => removeFromCart(i)} />
          )
        )}
      </ul>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Resumen del pedido
        </h2>

        <ul className="mt-4 space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={`${it.addedAt}-${i}`} className="flex justify-between gap-3 text-muted">
              <span className="truncate">
                {it.type === "custom" ? it.config.text.trim() || "Neón personalizado" : it.name}
              </span>
              <span className="shrink-0 tabular-nums text-text">{formatEUR(it.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg">
          <span className="text-muted">Total</span>
          <span className="font-bold text-text">{formatEUR(total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          IVA incluido. Envío calculado al finalizar.
        </p>
        <p className="mt-2 text-xs text-muted">
          {hasExpress
            ? "⚡ Incluye fabricación express (24-48 h)."
            : "Fabricación en 3-5 días hábiles."}
        </p>

        <Link
          href="/checkout"
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-neon-magenta text-sm font-semibold text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] transition-shadow hover:shadow-[0_0_28px_rgba(236,30,140,0.85)]"
        >
          Finalizar compra
        </Link>
        <Link
          href="/personalizar"
          className="mt-2 block text-center text-xs text-muted transition-colors hover:text-text"
        >
          Seguir diseñando
        </Link>
      </aside>
    </div>
  );
}
