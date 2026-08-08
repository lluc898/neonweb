"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductArtwork } from "@/components/shop/product-artwork";
import {
  DEFAULT_PRICING,
  DEFAULT_PRODUCT_OPTIONS,
  calcProductPrice,
  formatEUR,
  type PricingOptions,
} from "@/lib/pricing";
import { NEON_COLORS, findColor } from "@/lib/neon-options";
import { PRODUCT_SIZES, getCategoryLabel, type Product } from "@/lib/products";
import { NeonStage } from "@/components/shop/neon-stage";
import { addToCart } from "@/lib/cart";

const RGB_GRADIENT =
  "conic-gradient(#ff0040, #ff8c1a, #ffe600, #39ff14, #29abe2, #b026ff, #ff0040)";

/** Encabezado de un bloque de opciones, con el extra a la derecha si lo hay. */
function OptionLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <p className="text-sm font-semibold text-text">{children}</p>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/**
 * Ficha de producto de catálogo.
 *
 * Configurador reducido: el diseño ya está hecho, así que solo se elige color,
 * tamaño, contorno y si va a la intemperie. El precio se calcula en vivo con
 * `calcProductPrice` y se vuelve a calcular en servidor antes de cobrar.
 */
export function ProductDetail({
  product,
  options = DEFAULT_PRICING,
}: {
  product: Product;
  options?: PricingOptions;
}) {
  // El color por defecto es el del diseño; si no está en la paleta, el primero.
  const initialColor =
    NEON_COLORS.find((c) => c.hex.toLowerCase() === product.color.toLowerCase()) ?? NEON_COLORS[0];

  const [colorId, setColorId] = useState(initialColor.id);
  const [sizeId, setSizeId] = useState(DEFAULT_PRODUCT_OPTIONS.sizeId);
  const [supportId, setSupportId] = useState(DEFAULT_PRODUCT_OPTIONS.supportId);
  const [usageId, setUsageId] = useState(DEFAULT_PRODUCT_OPTIONS.usageId);
  const [added, setAdded] = useState(false);

  const color = findColor(colorId);
  const exteriorUsage = options.usages.find((u) => u.id !== "interior") ?? options.usages[0];
  const isExterior = usageId === exteriorUsage.id;

  const breakdown = calcProductPrice(
    product.price,
    { colorId, sizeId, supportId, usageId },
    options
  );

  const handleAdd = () => {
    addToCart(
      {
        type: "product",
        slug: product.slug,
        name: product.name,
        color: color.hex,
        colorId,
        sizeId,
        supportId,
        usageId,
        price: breakdown.total,
        breakdown,
      },
      product.name
    );
    setAdded(true);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Preview: el neón en su pared */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <NeonStage
          color={color.hex}
          className="group min-h-[320px] rounded-2xl border border-border p-8"
        >
          <ProductArtwork
            product={product}
            color={color.hex}
            sizeRem={product.symbol ? 5 : 3}
            flicker
            rgb={color.rgb}
          />
        </NeonStage>
      </div>

      {/* Info + opciones */}
      <div>
        <span className="text-xs uppercase tracking-wider text-muted">
          {getCategoryLabel(product.category)}
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold">
          {product.name}
        </h1>
        <p className="mt-3 text-muted">{product.description}</p>

        {/* Color */}
        <div className="mt-7">
          <OptionLabel hint={color.label}>Color</OptionLabel>
          <div className="flex flex-wrap gap-2.5">
            {NEON_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setColorId(c.id);
                  setAdded(false);
                }}
                aria-label={c.label}
                aria-pressed={colorId === c.id}
                title={c.rgb ? `${c.label} (+${formatEUR(options.rates.rgbExtra)})` : c.label}
                className={cn(
                  "h-9 w-9 rounded-full transition-transform hover:scale-110",
                  colorId === c.id && "ring-2 ring-white ring-offset-2 ring-offset-bg"
                )}
                style={
                  c.rgb
                    ? { backgroundImage: RGB_GRADIENT, boxShadow: "0 0 10px rgba(255,255,255,0.45)" }
                    : { backgroundColor: c.hex, boxShadow: `0 0 10px ${c.hex}` }
                }
              />
            ))}
          </div>
          {color.rgb && (
            <p className="mt-2 text-xs text-muted">
              Cambia de color con mando a distancia · +{formatEUR(options.rates.rgbExtra)}
            </p>
          )}
        </div>

        {/* Tamaño */}
        <div className="mt-7">
          <OptionLabel>Tamaño</OptionLabel>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PRODUCT_SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSizeId(s.id);
                  setAdded(false);
                }}
                aria-pressed={sizeId === s.id}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  sizeId === s.id
                    ? "border-neon-magenta bg-neon-magenta/10"
                    : "border-border bg-surface hover:border-muted"
                )}
              >
                <span className="block text-sm font-medium text-text">{s.label}</span>
                <span className="block text-xs text-muted">{s.dimension}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contorno (soporte de acrílico) */}
        <div className="mt-7">
          <OptionLabel>Contorno</OptionLabel>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {options.supports.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSupportId(s.id);
                  setAdded(false);
                }}
                aria-pressed={supportId === s.id}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  supportId === s.id
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-border bg-surface hover:border-muted"
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-text">{s.label}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {s.extraPrice > 0 ? `+${formatEUR(s.extraPrice)}` : "incluido"}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">
                  {s.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resistente al agua */}
        <div className="mt-7">
          <OptionLabel>Dónde lo vas a poner</OptionLabel>
          <button
            onClick={() => {
              setUsageId(isExterior ? "interior" : exteriorUsage.id);
              setAdded(false);
            }}
            role="switch"
            aria-checked={isExterior}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-all",
              isExterior
                ? "border-neon-cyan bg-neon-cyan/10"
                : "border-border bg-surface hover:border-muted"
            )}
          >
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                isExterior ? "bg-neon-cyan" : "bg-surface-2"
              )}
              aria-hidden
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  isExterior ? "translate-x-[1.15rem]" : "translate-x-0.5"
                )}
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-text">
                Resistente al agua (IP65)
              </span>
              <span className="block text-xs text-muted">
                {isExterior
                  ? `Preparado para exterior · +${Math.round((exteriorUsage.multiplier - 1) * 100)}%`
                  : "Actívalo si va en la calle, terraza o jardín"}
              </span>
            </span>
          </button>
        </div>

        {/* Precio + CTA */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">{formatEUR(breakdown.total)}</span>
            <span className="text-sm text-muted">IVA incl.</span>
          </div>

          {/* Solo se listan los extras que el cliente ha activado. */}
          {breakdown.total !== breakdown.base && (
            <ul className="mt-3 space-y-1 text-xs text-muted">
              <li className="flex justify-between gap-4">
                <span>Precio base</span>
                <span className="tabular-nums">{formatEUR(breakdown.base)}</span>
              </li>
              {breakdown.sizeDelta !== 0 && (
                <li className="flex justify-between gap-4">
                  <span>Tamaño {PRODUCT_SIZES.find((s) => s.id === sizeId)?.label}</span>
                  <span className="tabular-nums">
                    {breakdown.sizeDelta > 0 ? "+" : "−"}
                    {formatEUR(Math.abs(breakdown.sizeDelta))}
                  </span>
                </li>
              )}
              {breakdown.rgbExtra > 0 && (
                <li className="flex justify-between gap-4">
                  <span>RGB multicolor</span>
                  <span className="tabular-nums">+{formatEUR(breakdown.rgbExtra)}</span>
                </li>
              )}
              {breakdown.support > 0 && (
                <li className="flex justify-between gap-4">
                  <span>{options.supports.find((s) => s.id === supportId)?.label}</span>
                  <span className="tabular-nums">+{formatEUR(breakdown.support)}</span>
                </li>
              )}
              {breakdown.usageMultiplier !== 1 && (
                <li className="flex justify-between gap-4">
                  <span>Resistente al agua</span>
                  <span className="tabular-nums">× {breakdown.usageMultiplier}</span>
                </li>
              )}
            </ul>
          )}

          <button
            onClick={handleAdd}
            className={cn(
              "mt-5 h-12 w-full rounded-full text-sm font-semibold transition-all sm:w-auto sm:px-10",
              added
                ? "bg-neon-cyan/20 text-neon-cyan neon-box-cyan"
                : "bg-neon-magenta text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] hover:shadow-[0_0_28px_rgba(236,30,140,0.85)]"
            )}
          >
            {added ? "✓ Añadido al carrito" : "Añadir al carrito"}
          </button>

          <p className="mt-3 text-xs text-muted">
            Transformador, fijaciones y manual incluidos · Fabricación en 3-5 días hábiles
          </p>
        </div>
      </div>
    </div>
  );
}
