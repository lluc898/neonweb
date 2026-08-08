import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatEUR } from "@/lib/pricing";
import { updatePricingRuleAction } from "../actions";

export const metadata = { title: "Precios" };

type SizeMeta = { dimension?: string; heightCm?: number; charWidthCm?: number; tubePerCharM?: number };
type WattsMeta = { wattsPerM?: number; wattsPerMRgb?: number };
type EtaMeta = { eta?: string };

const inputCls =
  "w-24 rounded-md border border-border bg-bg px-3 py-1.5 text-text outline-none focus:border-neon-cyan";
const saveCls =
  "rounded-full border border-neon-cyan/60 px-4 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10";

export default async function AdminPreciosPage() {
  await requireAdmin();

  const rules = await prisma.pricingRule.findMany();
  const byGroup = (g: string) => rules.filter((r) => r.group === g);

  const rates = byGroup("RATE").filter((r) => r.code !== "watts");
  const watts = rules.find((r) => r.group === "RATE" && r.code === "watts");
  const wattsMeta = (watts?.meta ?? {}) as WattsMeta;
  const deliveries = byGroup("DELIVERY").sort((a, b) => (a.multiplier ?? 1) - (b.multiplier ?? 1));
  const sizes = byGroup("SIZE").sort((a, b) => {
    const ha = ((a.meta ?? {}) as SizeMeta).heightCm ?? 0;
    const hb = ((b.meta ?? {}) as SizeMeta).heightCm ?? 0;
    return ha - hb;
  });
  const supports = byGroup("SUPPORT").sort((a, b) => a.amountCents - b.amountCents);
  const usages = byGroup("USAGE").sort((a, b) => (a.multiplier ?? 1) - (b.multiplier ?? 1));
  // Envío: coste y umbral de gratuidad. A diferencia del resto, no afecta al
  // configurador sino al checkout y al reclamo "envío gratis desde X" de la portada.
  const shippingCost = rules.find((r) => r.group === "SHIPPING" && r.code === "cost");
  const shippingFree = rules.find((r) => r.group === "SHIPPING" && r.code === "free_from");

  return (
    <main className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Precios del configurador
        </h1>
        <p className="mt-1 text-sm text-muted">
          Fórmula de fabricación: metros de tubo × €/m + m² de material × €/m² (+RGB,
          soporte) × uso × entrega. Aquí se ajustan también los gastos de envío.
          Los cambios se aplican al momento.
        </p>
      </div>

      {/* Tarifas de fabricación */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Tarifas de fabricación
        </h2>
        <div className="space-y-2">
          {rates.map((r) => (
            <form
              key={r.id}
              action={updatePricingRuleAction}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <input type="hidden" name="id" value={r.id} />
              <span className="flex-1 font-medium text-text">{r.label}</span>
              <span className="text-xs text-muted">€</span>
              <input type="number" name="amount" min={0} step="0.5" defaultValue={r.amountCents / 100} className={inputCls} />
              <button className={saveCls}>Guardar</button>
            </form>
          ))}

          {watts && (
            <form
              action={updatePricingRuleAction}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <input type="hidden" name="id" value={watts.id} />
              <span className="flex-1 font-medium text-text">{watts.label}</span>
              <label className="flex items-center gap-2 text-xs text-muted">
                Normal
                <input type="number" name="wattsPerM" min={1} step="1" defaultValue={wattsMeta.wattsPerM ?? 12} className={inputCls} />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                RGB
                <input type="number" name="wattsPerMRgb" min={1} step="1" defaultValue={wattsMeta.wattsPerMRgb ?? 14} className={inputCls} />
              </label>
              <button className={saveCls}>Guardar</button>
            </form>
          )}
        </div>
      </section>

      {/* Envío */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Envío
        </h2>
        {shippingCost && shippingFree ? (
          <>
            <div className="space-y-2">
              {[shippingCost, shippingFree].map((r) => (
                <form
                  key={r.id}
                  action={updatePricingRuleAction}
                  className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <span className="flex-1 font-medium text-text">{r.label}</span>
                  <span className="text-xs text-muted">€</span>
                  <input
                    type="number"
                    name="amount"
                    min={0}
                    step={r.code === "cost" ? "0.1" : "10"}
                    defaultValue={r.amountCents / 100}
                    className={inputCls}
                  />
                  <button className={saveCls}>Guardar</button>
                </form>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              A partir de {formatEUR(shippingFree.amountCents / 100)} de compra el envío sale
              gratis. Este importe también es el que anuncia la portada, así que se actualiza
              solo en los dos sitios.
            </p>
          </>
        ) : (
          <p className="rounded-lg border border-neon-yellow/40 bg-neon-yellow/5 px-4 py-3 text-sm text-neon-yellow">
            No hay reglas de envío en la base de datos. Ejecuta <code>npm run db:seed</code> para
            crearlas; mientras tanto se cobran 9,90 € y hay envío gratis desde 200 €.
          </p>
        )}
      </section>

      {/* Entrega */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Entrega
        </h2>
        <div className="space-y-2">
          {deliveries.map((r) => (
            <form
              key={r.id}
              action={updatePricingRuleAction}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <input type="hidden" name="id" value={r.id} />
              <span className="flex-1 font-medium text-text">
                {r.label}
                <span className="ml-2 text-xs font-normal text-muted">
                  {((r.meta ?? {}) as EtaMeta).eta}
                </span>
              </span>
              <span className="text-xs text-muted">×</span>
              <input type="number" name="multiplier" min={1} step="0.05" defaultValue={r.multiplier ?? 1} className={inputCls} />
              <button className={saveCls}>Guardar</button>
            </form>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Express 24/48 h: el plus es el multiplicador (p. ej. 1,2 = +20%).
        </p>
      </section>

      {/* Tamaños (geometría para las estimaciones) */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Tamaños — geometría de estimación
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Altura letra (cm)</th>
                <th className="px-4 py-3">Ancho/letra (cm)</th>
                <th className="px-4 py-3">Tubo/letra (m)</th>
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
                    <td className="px-4 py-3" colSpan={4}>
                      <form action={updatePricingRuleAction} className="flex items-center gap-6">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="number" name="heightCm" min={1} step="1" defaultValue={meta.heightCm ?? 20} className={inputCls} />
                        <input type="number" name="charWidthCm" min={1} step="0.5" defaultValue={meta.charWidthCm ?? 7} className={inputCls} />
                        <input type="number" name="tubePerCharM" min={0.05} step="0.05" defaultValue={meta.tubePerCharM ?? 0.35} className={inputCls} />
                        <button className={saveCls}>Guardar</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Estos valores estiman los metros de tubo y el m² de material a partir del texto.
        </p>
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
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <input type="hidden" name="id" value={r.id} />
              <span className="flex-1 font-medium text-text">{r.label}</span>
              <span className="text-xs text-muted">+€</span>
              <input type="number" name="amount" min={0} step="1" defaultValue={r.amountCents / 100} className={inputCls} />
              <button className={saveCls}>Guardar</button>
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
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <input type="hidden" name="id" value={r.id} />
              <span className="flex-1 font-medium text-text">{r.label}</span>
              <span className="text-xs text-muted">×</span>
              <input type="number" name="multiplier" min={0.5} step="0.05" defaultValue={r.multiplier ?? 1} className={inputCls} />
              <button className={saveCls}>Guardar</button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
