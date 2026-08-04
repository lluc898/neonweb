"use client";

import { useMemo, useState } from "react";
import { NeonPreview } from "@/components/neon/neon-preview";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart";
import {
  calcPrice,
  countChars,
  formatEUR,
  DEFAULT_PRICING,
  type PricingOptions,
} from "@/lib/pricing";
import {
  NEON_BACKDROPS,
  NEON_COLORS,
  NEON_FONTS,
  FONTS_VISIBLE,
  DEFAULT_CONFIG,
  findBackdrop,
  findColor,
  findFont,
  type NeonConfig,
} from "@/lib/neon-options";

const MAX_CHARS = 40;

/** Etiqueta de sección de controles. */
function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-6 first:border-t-0 first:pt-0">
      <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-muted">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-text">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function NeonConfigurator({
  options = DEFAULT_PRICING,
}: {
  /** Reglas de precio activas (vienen de la BD vía la página servidor). */
  options?: PricingOptions;
}) {
  const [config, setConfig] = useState<NeonConfig>(DEFAULT_CONFIG);
  const [added, setAdded] = useState(false);
  const [showAllFonts, setShowAllFonts] = useState(false);

  const set = <K extends keyof NeonConfig>(key: K, value: NeonConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setAdded(false);
  };

  const font = findFont(config.fontId);
  const color = findColor(config.colorId);
  const backdrop = findBackdrop(config.backdropId);
  const usage =
    options.usages.find((u) => u.id === config.usageId) ?? options.usages[0];

  const price = useMemo(() => calcPrice(config, options), [config, options]);
  const chars = countChars(config.text);

  // Mostrar las 6 primeras; el resto tras "ver más". Si la seleccionada está
  // oculta, la mostramos igualmente para que no desaparezca al colapsar.
  const selectedHidden = NEON_FONTS.findIndex((f) => f.id === config.fontId) >= FONTS_VISIBLE;
  const visibleFonts =
    showAllFonts || selectedHidden ? NEON_FONTS : NEON_FONTS.slice(0, FONTS_VISIBLE);

  const handleAdd = () => {
    addToCart(
      { type: "custom", config, price: price.total, addedAt: Date.now() },
      config.text.trim() || "Neón personalizado"
    );
    setAdded(true);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* ---------------- PREVIEW (pegajoso en desktop) ---------------- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <NeonPreview
          text={config.text}
          fontCss={font.cssVar}
          scale={font.scale}
          hex={color.hex}
          backdropStyle={backdrop.style}
        />
        {/* Selector de fondo */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Fondo:</span>
          {NEON_BACKDROPS.map((b) => (
            <button
              key={b.id}
              onClick={() => set("backdropId", b.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                config.backdropId === b.id
                  ? "bg-surface-2 text-text"
                  : "text-muted hover:text-text"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Resumen de precio en desktop */}
        <div className="mt-5 hidden rounded-xl border border-border bg-surface p-5 lg:block">
          <PricePanel price={price} usageLabel={usage.label} onAdd={handleAdd} added={added} />
        </div>
      </div>

      {/* ---------------- CONTROLES ---------------- */}
      <div className="rounded-2xl border border-border bg-surface/50 p-6 sm:p-8">
        {/* 1. Texto */}
        <Section n={1} title="Tu texto">
          <textarea
            value={config.text}
            onChange={(e) => set("text", e.target.value.slice(0, MAX_CHARS + 10))}
            rows={2}
            maxLength={MAX_CHARS}
            placeholder="Escribe aquí…"
            className="w-full resize-none rounded-lg border border-border bg-bg px-4 py-3 text-lg text-text outline-none transition-colors placeholder:text-muted/60 focus:border-neon-cyan"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted">
            <span>Usa Enter para varias líneas</span>
            <span className={cn(chars > MAX_CHARS && "text-neon-magenta")}>
              {chars}/{MAX_CHARS} caracteres
            </span>
          </div>
        </Section>

        {/* 2. Fuente */}
        <Section n={2} title="Tipografía">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {visibleFonts.map((f) => (
              <button
                key={f.id}
                onClick={() => set("fontId", f.id)}
                className={cn(
                  "flex h-16 items-center justify-center rounded-lg border px-2 text-center transition-all",
                  config.fontId === f.id
                    ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                    : "border-border bg-bg text-text hover:border-muted"
                )}
                style={{ fontFamily: f.cssVar }}
                title={f.label}
              >
                <span className="truncate text-xl">Neon</span>
              </button>
            ))}
          </div>
          {NEON_FONTS.length > FONTS_VISIBLE && (
            <button
              onClick={() => setShowAllFonts((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-neon-cyan transition-colors hover:text-text"
            >
              {showAllFonts ? "Ver menos" : `Ver más tipografías (${NEON_FONTS.length - FONTS_VISIBLE})`}
              <span className={cn("transition-transform", showAllFonts && "rotate-180")}>▾</span>
            </button>
          )}
        </Section>

        {/* 3. Color */}
        <Section n={3} title={`Color · ${color.label}`}>
          <div className="flex flex-wrap gap-2.5">
            {NEON_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => set("colorId", c.id)}
                aria-label={c.label}
                title={c.label}
                className={cn(
                  "h-9 w-9 rounded-full transition-transform hover:scale-110",
                  config.colorId === c.id && "ring-2 ring-white ring-offset-2 ring-offset-surface"
                )}
                style={{
                  backgroundColor: c.hex,
                  boxShadow: `0 0 10px ${c.hex}`,
                }}
              />
            ))}
          </div>
        </Section>

        {/* 4. Tamaño */}
        <Section n={4} title="Tamaño">
          <div className="grid grid-cols-2 gap-2.5">
            {options.sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => set("sizeId", s.id)}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                  config.sizeId === s.id
                    ? "border-neon-magenta bg-neon-magenta/10"
                    : "border-border bg-bg hover:border-muted"
                )}
              >
                <span className="font-semibold text-text">{s.label}</span>
                <span className="text-xs text-muted">{s.dimension}</span>
                <span className="mt-1 text-sm text-text">desde {formatEUR(s.basePrice)}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* 5. Soporte */}
        <Section n={5} title="Soporte / fondo">
          <div className="flex flex-col gap-2.5">
            {options.supports.map((s) => (
              <button
                key={s.id}
                onClick={() => set("supportId", s.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all",
                  config.supportId === s.id
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-border bg-bg hover:border-muted"
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-text">{s.label}</span>
                  <span className="block text-xs text-muted">{s.description}</span>
                </span>
                <span className="text-sm text-muted">
                  {s.extraPrice ? `+${formatEUR(s.extraPrice)}` : "incluido"}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* 6. Uso */}
        <Section n={6} title="Uso">
          <div className="grid grid-cols-2 gap-2.5">
            {options.usages.map((u) => (
              <button
                key={u.id}
                onClick={() => set("usageId", u.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  config.usageId === u.id
                    ? "border-neon-magenta bg-neon-magenta/10"
                    : "border-border bg-bg hover:border-muted"
                )}
              >
                <span className="block text-sm font-medium text-text">{u.label}</span>
                <span className="block text-xs text-muted">{u.description}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Precio en móvil (sticky abajo) */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 lg:hidden">
          <PricePanel price={price} usageLabel={usage.label} onAdd={handleAdd} added={added} />
        </div>
      </div>
    </div>
  );
}

/** Panel de precio + CTA, reutilizado en desktop y móvil. */
function PricePanel({
  price,
  usageLabel,
  onAdd,
  added,
}: {
  price: ReturnType<typeof calcPrice>;
  usageLabel: string;
  onAdd: () => void;
  added: boolean;
}) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <span className="block text-xs uppercase tracking-wider text-muted">Precio estimado</span>
          <span className="text-4xl font-bold text-text">{formatEUR(price.total)}</span>
          <span className="ml-1 text-sm text-muted">IVA incl.</span>
        </div>
      </div>

      {/* Desglose */}
      <ul className="mt-3 space-y-1 text-xs text-muted">
        <li className="flex justify-between">
          <span>Base tamaño</span>
          <span>{formatEUR(price.base)}</span>
        </li>
        {price.charsExtra > 0 && (
          <li className="flex justify-between">
            <span>Texto largo (+{price.extraChars} caract.)</span>
            <span>+{formatEUR(price.charsExtra)}</span>
          </li>
        )}
        {price.support > 0 && (
          <li className="flex justify-between">
            <span>Soporte</span>
            <span>+{formatEUR(price.support)}</span>
          </li>
        )}
        {price.usageMultiplier !== 1 && (
          <li className="flex justify-between">
            <span>{usageLabel} (×{price.usageMultiplier})</span>
            <span>+{formatEUR(price.total - price.subtotal)}</span>
          </li>
        )}
      </ul>

      <button
        onClick={onAdd}
        className={cn(
          "mt-4 h-12 w-full rounded-full text-sm font-semibold transition-all",
          added
            ? "bg-neon-cyan/20 text-neon-cyan neon-box-cyan"
            : "bg-neon-magenta text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] hover:shadow-[0_0_28px_rgba(236,30,140,0.85)]"
        )}
      >
        {added ? "✓ Añadido al carrito" : "Añadir al carrito"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Precio orientativo. Confirmamos el diseño antes de fabricar.
      </p>
    </div>
  );
}
