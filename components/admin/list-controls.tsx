import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Controles compartidos de las listas del admin (pedidos, solicitudes):
 * chips de estado, buscador por nombre/email y paginación.
 * Todo server-rendered: filtros = enlaces con query params, búsqueda = form GET.
 */

export function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function StatusFilter({
  basePath,
  options,
  current,
  q,
}: {
  basePath: string;
  options: { value: string; label: string }[];
  current?: string;
  q?: string;
}) {
  const tabs = [{ value: "", label: "Todas" }, ...options];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = (current ?? "") === t.value;
        return (
          <Link
            key={t.value || "todas"}
            href={basePath + buildQuery({ estado: t.value || undefined, q })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                : "border-border text-muted hover:text-text"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SearchBox({
  basePath,
  estado,
  q,
  placeholder = "Buscar por nombre o email…",
}: {
  basePath: string;
  estado?: string;
  q?: string;
  placeholder?: string;
}) {
  return (
    <form method="get" action={basePath} className="flex items-center gap-2">
      {estado && <input type="hidden" name="estado" value={estado} />}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="w-56 rounded-full border border-border bg-bg px-4 py-1.5 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-neon-cyan"
      />
      <button className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-neon-cyan hover:text-neon-cyan">
        Buscar
      </button>
      {q && (
        <Link
          href={basePath + buildQuery({ estado })}
          className="text-xs text-muted hover:text-neon-magenta"
        >
          ✕ limpiar
        </Link>
      )}
    </form>
  );
}

export function Pagination({
  basePath,
  page,
  totalPages,
  estado,
  q,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  estado?: string;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  const link = (p: number) =>
    basePath + buildQuery({ estado, q, pagina: p > 1 ? String(p) : undefined });

  return (
    <nav className="mt-6 flex items-center justify-center gap-4 text-sm" aria-label="Paginación">
      {page > 1 ? (
        <Link href={link(page - 1)} className="text-neon-cyan hover:underline">
          ← Anterior
        </Link>
      ) : (
        <span className="text-muted/40">← Anterior</span>
      )}
      <span className="text-muted">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={link(page + 1)} className="text-neon-cyan hover:underline">
          Siguiente →
        </Link>
      ) : (
        <span className="text-muted/40">Siguiente →</span>
      )}
    </nav>
  );
}
