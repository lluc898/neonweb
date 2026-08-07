"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { createCustomRequestAction } from "@/app/(shop)/diseno-a-medida/actions";

/** Tamaños orientativos para que el cliente indique lo grande que lo quiere. */
const SIZES = [
  { id: "hasta 50 cm", label: "Pequeño", dimension: "hasta 50 cm" },
  { id: "hasta 80 cm", label: "Mediano", dimension: "hasta 80 cm" },
  { id: "hasta 100 cm", label: "Grande", dimension: "hasta 100 cm" },
  { id: "hasta 150 cm", label: "Gigante", dimension: "hasta 150 cm" },
  { id: "otro", label: "Otro", dimension: "indícalo en las notas" },
];

const MAX_MB = 6;

function SubmitButton() {
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
      {pending ? "Enviando…" : "Enviar solicitud"}
    </button>
  );
}

export function CustomRequestForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [size, setSize] = useState<string>("hasta 80 cm");
  const fileInput = useRef<HTMLInputElement>(null);

  const onFileChange = (file: File | undefined) => {
    setFileError(null);
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`La imagen supera los ${MAX_MB} MB. Reduce su tamaño e inténtalo de nuevo.`);
      if (fileInput.current) fileInput.current.value = "";
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  return (
    <form action={createCustomRequestAction} className="space-y-8 text-left">
      {/* 1. Imagen */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          1 · Tu imagen o boceto
        </h2>
        <label
          className={cn(
            "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            preview ? "border-neon-cyan/60 bg-neon-cyan/5" : "border-border bg-surface/50 hover:border-muted"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL local, dimensiones libres
            <img src={preview} alt="Vista previa de tu diseño" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <span className="text-3xl" aria-hidden>🖼️</span>
              <span className="text-sm text-text">Haz clic para subir tu imagen</span>
              <span className="text-xs text-muted">PNG, JPG, WEBP o SVG · máx. {MAX_MB} MB</span>
            </>
          )}
          <input
            ref={fileInput}
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              if (fileInput.current) fileInput.current.value = "";
            }}
            className="mt-2 text-xs text-muted hover:text-neon-magenta"
          >
            ✕ Quitar imagen
          </button>
        )}
        {fileError && <p className="mt-2 text-sm text-neon-magenta">{fileError}</p>}
        <p className="mt-2 text-xs text-muted">
          ¿No tienes imagen? Puedes describir tu idea en las notas y te ayudamos con el diseño.
        </p>
      </section>

      {/* 2. Tamaño deseado */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          2 · ¿Cómo de grande lo quieres?
        </h2>
        <input type="hidden" name="desiredSize" value={size} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSize(s.id)}
              className={cn(
                "flex flex-col items-center rounded-lg border p-3 text-center transition-all",
                size === s.id
                  ? "border-neon-cyan bg-neon-cyan/10"
                  : "border-border bg-surface hover:border-muted"
              )}
            >
              <span className="text-sm font-medium text-text">{s.label}</span>
              <span className="text-xs text-muted">{s.dimension}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Detalles y contacto */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          3 · Cuéntanos y te enviamos presupuesto
        </h2>
        <div className="space-y-3">
          <textarea
            name="notes"
            rows={3}
            maxLength={2000}
            placeholder="Notas: colores que te gustan, dónde irá colgado, fecha para la que lo necesitas…"
            className="w-full resize-none rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors placeholder:text-muted/60 focus:border-neon-cyan"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="name"
              required
              placeholder="Tu nombre *"
              className="rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors placeholder:text-muted/60 focus:border-neon-cyan"
            />
            <input
              type="email"
              name="email"
              required
              placeholder="Tu email *"
              className="rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors placeholder:text-muted/60 focus:border-neon-cyan"
            />
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Teléfono (opcional, para WhatsApp)"
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors placeholder:text-muted/60 focus:border-neon-cyan"
          />
        </div>
      </section>

      <SubmitButton />
      <p className="text-center text-xs text-muted">
        Sin compromiso: te respondemos con un presupuesto en 24-48 h laborables.
      </p>
    </form>
  );
}
