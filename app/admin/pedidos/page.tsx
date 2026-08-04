import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatEUR } from "@/lib/pricing";
import {
  Pagination,
  SearchBox,
  StatusFilter,
} from "@/components/admin/list-controls";
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import { updateOrderStatusAction } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  IN_PRODUCTION: "En producción",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "text-neon-magenta",
  IN_PRODUCTION: "text-neon-cyan",
  SHIPPED: "text-neon-yellow",
  DELIVERED: "text-text",
  CANCELLED: "text-muted",
};

const PAGE_SIZE = 10;
const BASE = "/admin/pedidos";

const fmtDateTime = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

type Customization = {
  text?: string;
  fontId?: string;
  colorId?: string;
  sizeId?: string;
  supportId?: string;
  usageId?: string;
};

export default async function AdminPedidosPage({
  searchParams,
}: PageProps<"/admin/pedidos">) {
  await requireAdmin();

  const params = await searchParams;
  const estado = typeof params.estado === "string" ? params.estado : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;
  const page = Math.max(1, Number(params.pagina) || 1);

  const where = {
    ...(estado && estado in STATUS_LABELS ? { status: estado as OrderStatus } : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { items: true },
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
          Pedidos <span className="text-base font-normal text-muted">({total})</span>
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

      {!orders.length ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
          {q || estado
            ? "Ningún pedido coincide con los filtros."
            : "Aún no hay pedidos. Cuando lleguen, aparecerán aquí con su ficha de producción completa."}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <details key={o.id} className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-4">
                <span className={`text-xs font-bold uppercase ${STATUS_COLORS[o.status]}`}>
                  {STATUS_LABELS[o.status]}
                </span>
                <span className="flex-1 font-medium text-text">
                  {o.customerName}
                  <span className="ml-2 text-sm font-normal text-muted">{o.customerEmail}</span>
                </span>
                <span className="text-sm text-muted">{fmtDateTime.format(o.createdAt)}</span>
                <span className="font-semibold text-text">{formatEUR(o.totalCents / 100)}</span>
              </summary>

              <div className="border-t border-border/50 px-5 py-4">
                {/* Ficha de producción */}
                <ul className="space-y-3">
                  {o.items.map((item) => {
                    const c = (item.customization ?? null) as Customization | null;
                    return (
                      <li key={item.id} className="rounded-lg bg-bg p-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-text">
                            {item.quantity}× {item.name}
                            <span className="ml-2 text-xs uppercase text-muted">
                              {item.kind === "CUSTOM" ? "personalizado" : "catálogo"}
                            </span>
                          </span>
                          <span className="text-muted">{formatEUR(item.priceCents / 100)}</span>
                        </div>
                        {c && (
                          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-3">
                            {c.text && <div><dt className="inline font-semibold">Texto: </dt><dd className="inline">“{c.text}”</dd></div>}
                            {c.fontId && <div><dt className="inline font-semibold">Fuente: </dt><dd className="inline">{c.fontId}</dd></div>}
                            {c.colorId && <div><dt className="inline font-semibold">Color: </dt><dd className="inline">{c.colorId}</dd></div>}
                            {c.sizeId && <div><dt className="inline font-semibold">Tamaño: </dt><dd className="inline">{c.sizeId}</dd></div>}
                            {c.supportId && <div><dt className="inline font-semibold">Soporte: </dt><dd className="inline">{c.supportId}</dd></div>}
                            {c.usageId && <div><dt className="inline font-semibold">Uso: </dt><dd className="inline">{c.usageId}</dd></div>}
                          </dl>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Cambio de estado */}
                <form
                  action={updateOrderStatusAction}
                  className="mt-4 flex items-center gap-3 border-t border-border/50 pt-4"
                >
                  <input type="hidden" name="id" value={o.id} />
                  <label className="text-xs text-muted">Estado:</label>
                  <select
                    name="status"
                    defaultValue={o.status}
                    className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-neon-cyan"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <button className="rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                    Actualizar
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}

      <Pagination basePath={BASE} page={page} totalPages={totalPages} estado={estado} q={q} />
    </main>
  );
}
