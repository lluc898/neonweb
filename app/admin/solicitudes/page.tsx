import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatEUR } from "@/lib/pricing";
import {
  Pagination,
  SearchBox,
  StatusFilter,
} from "@/components/admin/list-controls";
import type { RequestStatus } from "@/lib/generated/prisma/enums";
import { updateRequestStatusAction } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nueva",
  QUOTED: "Presupuestada",
  ACCEPTED: "Aceptada",
  REJECTED: "Descartada",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "text-neon-magenta",
  QUOTED: "text-neon-yellow",
  ACCEPTED: "text-neon-cyan",
  REJECTED: "text-muted",
};

const PAGE_SIZE = 10;
const BASE = "/admin/solicitudes";

const fmtDateTime = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminSolicitudesPage({
  searchParams,
}: PageProps<"/admin/solicitudes">) {
  await requireAdmin();

  const params = await searchParams;
  const estado = typeof params.estado === "string" ? params.estado : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;
  const page = Math.max(1, Number(params.pagina) || 1);

  const where = {
    ...(estado && estado in STATUS_LABELS ? { status: estado as RequestStatus } : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, requests] = await Promise.all([
    prisma.customRequest.count({ where }),
    prisma.customRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Solicitudes a medida{" "}
          <span className="text-base font-normal text-muted">({total})</span>
        </h1>
        <SearchBox basePath={BASE} estado={estado} q={q} />
      </div>

      <div className="mb-6">
        <StatusFilter
          basePath={BASE}
          current={estado}
          q={q}
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      {!requests.length ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
          {q || estado
            ? "Ninguna solicitud coincide con los filtros."
            : "Aún no hay solicitudes de diseño a medida. Cuando un cliente suba su imagen desde la web, aparecerá aquí para presupuestarla."}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start gap-5">
                {/* Imagen subida */}
                <div className="flex flex-col items-center gap-2">
                  {r.imageUrl ? (
                    <>
                      <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" title="Ver a tamaño completo">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL externa de Storage, dimensiones variables */}
                        <img
                          src={r.imageUrl}
                          alt={`Diseño de ${r.customerName}`}
                          className="h-28 w-28 rounded-lg border border-border bg-bg object-contain transition-opacity hover:opacity-80"
                        />
                      </a>
                      <a
                        href={`${r.imageUrl}?download=solicitud-${r.id}`}
                        className="rounded-full border border-neon-cyan/60 px-3 py-1 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                      >
                        ⬇ Descargar
                      </a>
                    </>
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-border bg-bg text-xs text-muted">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs font-bold uppercase ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="font-medium text-text">{r.customerName}</span>
                    <a href={`mailto:${r.customerEmail}`} className="text-sm text-neon-cyan hover:underline">
                      {r.customerEmail}
                    </a>
                    {r.customerPhone && <span className="text-sm text-muted">{r.customerPhone}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Recibida el {fmtDateTime.format(r.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Tamaño deseado: <span className="text-text">{r.desiredSize}</span>
                    {r.quoteCents != null && (
                      <> · Presupuesto: <span className="text-text">{formatEUR(r.quoteCents / 100)}</span></>
                    )}
                  </p>
                  {r.notes && <p className="mt-2 text-sm text-text">“{r.notes}”</p>}

                  <form
                    action={updateRequestStatusAction}
                    className="mt-4 flex flex-wrap items-center gap-3"
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <select
                      name="status"
                      defaultValue={r.status}
                      className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-neon-cyan"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="quote"
                      min={0}
                      step="1"
                      placeholder="Presupuesto €"
                      defaultValue={r.quoteCents != null ? Math.round(r.quoteCents / 100) : undefined}
                      className="w-32 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-neon-cyan"
                    />
                    <button className="rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                      Guardar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination basePath={BASE} page={page} totalPages={totalPages} estado={estado} q={q} />
    </main>
  );
}
