"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { NEON_COLORS, NEON_FONTS } from "@/lib/neon-options";
import { formatEUR } from "@/lib/pricing";
import type { Product, ProductCategory } from "@/lib/products";
import {
  MAX_SVG_CHARS,
  SVG_ERROR_MESSAGES,
  neonSvgMarkup,
  sanitizeSvg,
  suggestedStroke,
  viewBoxOf,
} from "@/lib/svg-neon";
import { NeonStage } from "@/components/shop/neon-stage";
import { ProductArtwork } from "@/components/shop/product-artwork";

/**
 * Alta de producto de catálogo. Dos formas de crear el diseño:
 *
 *  1. **Editor de texto** — el mismo lenguaje del configurador (texto +
 *     tipografía + color), o un emoji para los iconos.
 *  2. **Vectorial** — se arrastra un SVG y se convierte en trazo de neón.
 *
 * Todo lo que se ve aquí es una previsualización: el saneado del SVG y el
 * precio los vuelve a hacer el servidor en `createProductAction`.
 */

/** Margen alrededor del dibujo, como fracción de su lado mayor. */
const INK_PADDING = 0.08;

/**
 * Reencuadra el SVG a la **tinta real** del dibujo.
 *
 * Los archivos de logo suelen venir con un lienzo mucho mayor que el trazo, o
 * con el dibujo descentrado. Si se respeta ese viewBox, el neón sale pequeño y
 * desplazado. Aquí se mide el bounding box real con `getBBox()` (hace falta el
 * DOM, por eso vive en el cliente) y se reescribe el viewBox ajustado, con un
 * margen para que el grosor del tubo no se corte en los bordes.
 */
function fitViewBoxToInk(markup: string, host: HTMLElement): string {
  host.innerHTML = markup;
  const svg = host.firstElementChild as SVGSVGElement | null;
  if (!svg) return markup;

  let box: DOMRect;
  try {
    box = svg.getBBox();
  } catch {
    return markup; // navegador sin layout para el SVG: se deja como estaba
  }
  if (!(box.width > 0) || !(box.height > 0)) return markup;

  const pad = Math.max(box.width, box.height) * INK_PADDING;
  const round = (n: number) => Math.round(n * 100) / 100;
  const viewBox = [
    round(box.x - pad),
    round(box.y - pad),
    round(box.width + pad * 2),
    round(box.height + pad * 2),
  ].join(" ");

  host.innerHTML = "";
  return markup.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
}

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-neon-cyan";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted";

type Mode = "TEXT" | "SVG";

export function NewProductForm({
  categories,
  action,
}: {
  categories: ProductCategory[];
  action: (formData: FormData) => void;
}) {
  const [mode, setMode] = useState<Mode>("TEXT");

  // --- Campos comunes ---
  const [name, setName] = useState("");
  const [color, setColor] = useState(NEON_COLORS[3].hex);
  const [price, setPrice] = useState(229);

  // --- Modo texto ---
  const [designText, setDesignText] = useState("");
  const [fontId, setFontId] = useState(NEON_FONTS[2].id);
  const [symbol, setSymbol] = useState("");

  // --- Modo vectorial ---
  const [svgMarkup, setSvgMarkup] = useState("");
  const [svgStroke, setSvgStroke] = useState(2);
  /**
   * Tope del deslizador, fijado al cargar el archivo. Si se derivara del valor
   * actual, la escala cambiaría mientras arrastras y el control se atasca.
   */
  const [strokeMax, setStrokeMax] = useState(12);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const sourceRef = useRef<HTMLInputElement>(null);
  /** Contenedor oculto donde se mide el SVG para reencuadrarlo. */
  const measureRef = useRef<HTMLDivElement>(null);

  /** Lee el archivo soltado: si es SVG se convierte; si es EPS solo se adjunta. */
  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setSvgError(null);

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) {
      // EPS/AI/PDF: no hay forma de dibujarlos en el navegador. Se adjuntan
      // como archivo de producción y hace falta un SVG para la tienda.
      setSvgMarkup("");
      setSvgError(
        "Los EPS y AI no se pueden dibujar en la web. Se guardará como archivo de producción, pero necesitas subir además un SVG para que el neón se vea en la tienda."
      );
      return;
    }

    const text = await file.text();
    const result = sanitizeSvg(text);
    if (!result.ok) {
      setSvgMarkup("");
      setSvgError(SVG_ERROR_MESSAGES[result.error]);
      return;
    }

    // Reencuadrar antes de calcular el grosor: el trazo se dimensiona sobre el
    // tamaño real del dibujo, no sobre el lienzo que trajera el archivo.
    let markup = neonSvgMarkup(result.svg);
    if (measureRef.current) markup = fitViewBoxToInk(markup, measureRef.current);

    const stroke = suggestedStroke(viewBoxOf(markup) ?? result.svg.viewBox);
    setSvgMarkup(markup);
    setSvgStroke(stroke);
    setStrokeMax(Math.max(stroke * 5, 1));
  };

  // Producto ficticio para reutilizar el mismo renderizador que la tienda:
  // lo que se ve aquí es exactamente lo que verá el cliente.
  const preview: Product = {
    id: "preview",
    slug: "preview",
    name: name || "Nombre del producto",
    category: "",
    price,
    color,
    description: "",
    design: mode,
    designText: designText || undefined,
    fontId,
    symbol: mode === "TEXT" ? symbol || undefined : undefined,
    svgMarkup: svgMarkup || undefined,
    svgStroke,
  };

  const canSubmit = name.trim().length >= 2 && (mode === "TEXT" || svgMarkup !== "");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/*
        Banco de medida: el SVG se monta aquí para llamar a getBBox() y
        reencuadrarlo. No puede ir con `display:none` (sin layout no hay
        bounding box), de ahí el truco de tamaño cero y overflow oculto.
      */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] top-0 h-48 w-48 overflow-hidden opacity-0"
      />

      <input type="hidden" name="design" value={mode} />
      <input type="hidden" name="svg" value={svgMarkup} />
      <input type="hidden" name="color" value={color} />

      <div className="space-y-8">
        {/* Selector de modo */}
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "TEXT" as const,
                title: "Con el editor",
                text: "Escribe el texto y elige tipografía, como en el configurador.",
              },
              {
                id: "SVG" as const,
                title: "Subir un vectorial",
                text: "Arrastra un SVG y se convierte en trazo de neón.",
              },
            ] satisfies { id: Mode; title: string; text: string }[]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                mode === m.id
                  ? "border-neon-cyan bg-neon-cyan/10"
                  : "border-border bg-surface hover:border-muted"
              )}
            >
              <span className="block text-sm font-semibold text-text">{m.title}</span>
              <span className="mt-1 block text-xs text-muted">{m.text}</span>
            </button>
          ))}
        </div>

        {/* ---------------- Diseño ---------------- */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Diseño
          </h2>

          {mode === "TEXT" ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="designText" className={labelCls}>
                  Texto del neón
                </label>
                <input
                  id="designText"
                  name="designText"
                  value={designText}
                  onChange={(e) => setDesignText(e.target.value)}
                  placeholder="Se usa el nombre del producto si lo dejas vacío"
                  maxLength={60}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              <div>
                <span className={labelCls}>Tipografía</span>
                <input type="hidden" name="fontId" value={fontId} />
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {NEON_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontId(f.id)}
                      aria-pressed={fontId === f.id}
                      className={cn(
                        "truncate rounded-lg border px-3 py-2 text-center transition-all",
                        fontId === f.id
                          ? "border-neon-cyan bg-neon-cyan/10"
                          : "border-border bg-bg hover:border-muted"
                      )}
                      style={{ fontFamily: f.cssVar, fontSize: `${0.95 * f.scale}rem` }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="symbol" className={labelCls}>
                  Emoji (opcional)
                </label>
                <input
                  id="symbol"
                  name="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="⚡"
                  maxLength={8}
                  className={`mt-1.5 w-24 ${inputCls}`}
                />
                <p className="mt-1 text-xs text-muted">
                  Si pones uno, se dibuja el emoji en vez del texto (diseños de icono).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void takeFile(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                  dragging ? "border-neon-cyan bg-neon-cyan/5" : "border-border bg-bg"
                )}
              >
                <p className="text-sm text-text">Arrastra aquí el archivo del diseño</p>
                <p className="mt-1 text-xs text-muted">
                  SVG para que se vea en la tienda · EPS/AI se guardan para taller
                </p>
                <button
                  type="button"
                  onClick={() => sourceRef.current?.click()}
                  className="mt-4 rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                >
                  Elegir archivo
                </button>
                <input
                  ref={sourceRef}
                  type="file"
                  name="sourceFile"
                  accept=".svg,.eps,.ai,.pdf,image/svg+xml,application/postscript"
                  className="hidden"
                  onChange={(e) => void takeFile(e.target.files?.[0])}
                />
                {fileName && (
                  <p className="mt-3 truncate text-xs text-muted">
                    Archivo: <span className="text-text">{fileName}</span>
                  </p>
                )}
              </div>

              {svgError && (
                <p className="rounded-lg border border-neon-yellow/40 bg-neon-yellow/5 px-3 py-2.5 text-xs text-neon-yellow">
                  {svgError}
                </p>
              )}

              {svgMarkup && (
                <>
                  <div>
                    <label htmlFor="svgStroke" className={labelCls}>
                      Grosor del tubo
                    </label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        id="svgStroke"
                        name="svgStroke"
                        type="range"
                        min={strokeMax / 40}
                        max={strokeMax}
                        step={strokeMax / 200}
                        value={svgStroke}
                        onChange={(e) => setSvgStroke(Number(e.target.value))}
                        className="flex-1 accent-[#29abe2]"
                      />
                      <span className="w-14 text-right text-xs tabular-nums text-muted">
                        {svgStroke < 1 ? svgStroke.toFixed(2) : svgStroke.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted">
                    Dibujo reencuadrado y centrado automáticamente ·{" "}
                    {svgMarkup.length.toLocaleString("es-ES")} de{" "}
                    {MAX_SVG_CHARS.toLocaleString("es-ES")} caracteres.
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {/* ---------------- Datos del producto ---------------- */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Ficha
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelCls}>
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>
              <div>
                <label htmlFor="categoryId" className={labelCls}>
                  Categoría
                </label>
                <select id="categoryId" name="categoryId" required className={`mt-1.5 ${inputCls}`}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className={labelCls}>
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                maxLength={500}
                className={`mt-1.5 ${inputCls}`}
              />
            </div>

            <div>
              <label htmlFor="price" className={labelCls}>
                Precio base (tamaño Mediano)
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={1}
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                  className={`w-32 ${inputCls}`}
                />
                <span className="text-xs text-muted">
                  El cliente verá {formatEUR(price - 40)} como &laquo;desde&raquo; (talla pequeña).
                </span>
              </div>
            </div>

            <div>
              <span className={labelCls}>Color del diseño</span>
              <div className="mt-1.5 flex flex-wrap gap-2.5">
                {NEON_COLORS.filter((c) => !c.rgb).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    aria-label={c.label}
                    title={c.label}
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform hover:scale-110",
                      color === c.hex && "ring-2 ring-white ring-offset-2 ring-offset-surface"
                    )}
                    style={{ backgroundColor: c.hex, boxShadow: `0 0 10px ${c.hex}` }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Es el color con el que se muestra en el catálogo; el cliente puede cambiarlo.
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked
                className="h-4 w-4 accent-[#29abe2]"
              />
              <span className="text-text">Publicar en la tienda al crearlo</span>
            </label>
          </div>
        </section>
      </div>

      {/* ---------------- Vista previa ---------------- */}
      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
          Vista previa
        </p>
        <NeonStage color={color} className="h-56 rounded-2xl border border-border p-6">
          <ProductArtwork product={preview} sizeRem={preview.symbol ? 3.75 : 2.1} />
        </NeonStage>
        <p className="text-xs text-muted">
          Así se verá la tarjeta en el catálogo.
        </p>

        <button
          disabled={!canSubmit}
          className="h-12 w-full rounded-full bg-neon-magenta text-sm font-semibold text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] transition-shadow hover:shadow-[0_0_28px_rgba(236,30,140,0.85)] disabled:pointer-events-none disabled:opacity-40"
        >
          Crear producto
        </button>
        {!canSubmit && (
          <p className="text-center text-xs text-muted">
            {name.trim().length < 2
              ? "Ponle un nombre para continuar."
              : "Sube un SVG válido para continuar."}
          </p>
        )}
      </aside>
    </form>
  );
}
