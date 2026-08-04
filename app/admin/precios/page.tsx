import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { updatePricingRuleAction } from "../actions";

type SizeMeta = { dimension?: string; includedChars?: number; perExtraCharCents?: number };

export default async function AdminPreciosPage() {
  await requireAdmin();

  const rules = await prisma.pricingRule.findMany();
  const sizes = rules
    .filter((r) => r.group === "SIZE")
    .sort((a, b) => a.amountCents - b.amountCents);
  const supports = rules
    .filter((r) => r.group === "SUPPORT")
    .sort((a, b) => a.amountCents - b.amountCents);
  const usages = rules
    .filter((r) => r.group === "USAGE")
    .sort((a, b) => (a.multiplier ?? 1) - (b.multiplier ?? 1));

  return (
    <main className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Precios del configurador
        </h1>
        <p className="mt-1 text-sm text-muted">
          Estos valores alimentan el configurador de neones personalizados. Los
          cambios se aplican al momento.
        </p>
      </div>

      {/* Tamaños */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Precio por tamaño
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Base (€)</th>
                <th className="px-4 py-3">€/carácter extra</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sizes.map((r) => {
                const meta = (r.meta ?? {}) as SizeMeta;
                return (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text">{r.label}</span>
                      <span className="ml-2 text-xs text-muted">{meta.dimension}</span>
                    </td>
                    <td className="px-4 py-3" colSpan={3}>
                      <form action={updatePricingRuleAction} className="flex items-center gap-4">
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="number"
                          name="amount"
                          min={0}
                          step="1"
                          defaultValue={Math.round(r.amountCents / 100)}
                          className="w-24 rounded-md border border-border bg-bg px-3 py-1.5 text-text outline-none focus:border-neon-cyan"
                        />
                        <input
                          type="number"
                          name="perExtraChar"
                          min={0}
                          step="1"
                          defaultValue={Math.round((meta.perExtraCharCents ?? 0) / 100)}
                          className="w-24 rounded-md border border-border bg-bg px-3 py-1.5 text-text outline-none focus:border-neon-cyan"
                        />
                        <button className="rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                          Guardar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Soportes */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Suplemento por soporte
        </h2>
        <div className="space-y-2">
          {supports.map((r) => (
            <form
              key={r.id}
              action={updatePricingRuleAction}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5"
            >
              <input type="hidden" name="id" value={r.id} />
              <span className="flex-1 text-sm font-medium text-text">{r.label}</span>
              <span className="text-xs text-muted">+€</span>
              <input
                type="number"
                name="amount"
                min={0}
                step="1"
                defaultValue={Math.round(r.amountCents / 100)}
                className="w-24 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-neon-cyan"
              />
              <button className="rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                Guardar
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Usos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Multiplicador por uso
        </h2>
        <div className="space-y-2">
          {usages.map((r) => (
            <form
              key={r.id}
              action={updatePricingRuleAction}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5"
            >
              <input type="hidden" name="id" value={r.id} />
              <span className="flex-1 text-sm font-medium text-text">{r.label}</span>
              <span className="text-xs text-muted">×</span>
              <input
                type="number"
                name="multiplier"
                min={0.5}
                step="0.05"
                defaultValue={r.multiplier ?? 1}
                className="w-24 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-neon-cyan"
              />
              <button className="rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                Guardar
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
