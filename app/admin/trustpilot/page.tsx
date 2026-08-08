import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { TrustpilotRating } from "@/components/shop/trustpilot-rating";
import {
  TRUSTPILOT_SETTING_KEY,
  formatTrustScore,
  parseTrustpilot,
  trustpilotLabel,
} from "@/lib/trustpilot";
import { updateTrustpilotAction } from "../actions";

export const metadata = { title: "Opiniones" };

const fmtDateTime = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

const ERROR_MESSAGES: Record<string, string> = {
  score: "La puntuación debe estar entre 0 y 5.",
  reviews: "El número de opiniones debe ser 0 o más.",
  url: "El enlace debe ser una ficha de trustpilot.com.",
};

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-text outline-none focus:border-neon-cyan";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted";

export default async function AdminTrustpilotPage({
  searchParams,
}: PageProps<"/admin/trustpilot">) {
  await requireAdmin();
  const { ok, error } = await searchParams;

  const row = await prisma.siteSetting.findUnique({
    where: { key: TRUSTPILOT_SETTING_KEY },
  });
  const data = parseTrustpilot(row?.value);

  return (
    <main className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Valoración de Trustpilot
        </h1>
        <p className="mt-1 text-sm text-muted">
          La nota que se muestra en la portada y en el pie de la tienda.
        </p>
      </div>

      {/* Lo primero que hay que entender de esta pantalla. */}
      <div className="rounded-xl border border-neon-yellow/40 bg-neon-yellow/5 px-4 py-3.5 text-sm">
        <p className="font-semibold text-neon-yellow">Esto no se actualiza solo</p>
        <p className="mt-1 text-muted">
          Trustpilot bloquea la lectura automática, así que cuando os dejen
          opiniones nuevas la nota de aquí se queda anticuada. Abre tu ficha,
          copia los dos números y guárdalos. Publicar una valoración que no
          coincide con la real va contra las normas de Trustpilot.
        </p>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-neon-cyan hover:underline"
        >
          Abrir mi ficha de Trustpilot →
        </a>
      </div>

      {ok && (
        <p className="rounded-lg border border-neon-cyan/40 bg-neon-cyan/5 px-4 py-3 text-sm text-neon-cyan">
          ✓ Valoración actualizada. Ya se ve en la tienda.
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-neon-magenta/40 bg-neon-magenta/5 px-4 py-3 text-sm text-neon-magenta">
          {ERROR_MESSAGES[String(error)] ?? "No se pudo guardar."}
        </p>
      )}

      <form action={updateTrustpilotAction} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="score" className={labelCls}>
              Puntuación (sobre 5)
            </label>
            <input
              id="score"
              name="score"
              type="number"
              min={0}
              max={5}
              step="0.1"
              required
              defaultValue={data.score}
              className={`mt-1.5 ${inputCls}`}
            />
            <p className="mt-1 text-xs text-muted">
              Se traduce sola a la etiqueta de Trustpilot ({trustpilotLabel(data.score)} con{" "}
              {formatTrustScore(data.score)}).
            </p>
          </div>

          <div>
            <label htmlFor="reviews" className={labelCls}>
              Nº de opiniones
            </label>
            <input
              id="reviews"
              name="reviews"
              type="number"
              min={0}
              step="1"
              required
              defaultValue={data.reviews}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="url" className={labelCls}>
            Enlace a la ficha
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            defaultValue={data.url}
            className={`mt-1.5 ${inputCls}`}
          />
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={data.visible}
            className="h-4 w-4 accent-[#00B67A]"
          />
          <span>
            <span className="font-medium text-text">Mostrar la insignia en la tienda</span>
            <span className="ml-2 text-xs text-muted">
              Desmárcalo para esconderla sin perder los datos.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-4">
          <button className="rounded-full border border-neon-cyan/60 px-5 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10">
            Guardar
          </button>
          {row && (
            <span className="text-xs text-muted">
              Última actualización: {fmtDateTime.format(row.updatedAt)}
            </span>
          )}
        </div>
      </form>

      {/* Cómo queda ahora mismo, con los dos formatos que usa la tienda. */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Vista previa
        </h2>
        {data.visible ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-bg p-6">
            <TrustpilotRating data={data} />
            <TrustpilotRating data={data} variant="card" className="w-full max-w-sm" />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            La insignia está oculta: no aparece en ninguna página de la tienda.
          </p>
        )}
      </section>
    </main>
  );
}
