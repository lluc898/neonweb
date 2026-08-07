import { listSessions, requireAdmin } from "@/lib/admin-auth";
import { logoutEverywhereAction } from "../actions";

export const metadata = { title: "Seguridad" };

const fmtDateTime = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminSeguridadPage() {
  const session = await requireAdmin();
  const isSuper = session.user.isSuperadmin;

  // El superadmin ve todas las sesiones; el resto, solo las suyas.
  const sessions = (await listSessions()).filter(
    (s) => isSuper || s.userId === session.user.id
  );

  return (
    <main className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Seguridad
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sesión iniciada como <span className="text-text">{session.user.username}</span>.
          Tu cuenta tiene el 2FA activo (obligatorio para todos los usuarios).
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-text">
            Sesiones activas{" "}
            <span className="text-sm font-normal text-muted">({sessions.length})</span>
          </h2>
          {isSuper && (
            <form action={logoutEverywhereAction}>
              <button className="rounded-full border border-neon-magenta/60 px-4 py-2 text-xs font-semibold text-neon-magenta transition-colors hover:bg-neon-magenta/10">
                Cerrar TODAS las sesiones (todos los usuarios)
              </button>
            </form>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          {isSuper
            ? "Si sospechas de un acceso no autorizado, cierra todas las sesiones: cualquier cookie robada dejará de valer."
            : "Estas son tus sesiones abiertas en distintos dispositivos."}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                {isSuper && <th className="py-2 pr-4">Usuario</th>}
                <th className="py-2 pr-4">Creada</th>
                <th className="py-2 pr-4">Último uso</th>
                <th className="py-2 pr-4">IP</th>
                <th className="py-2">Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0">
                  {isSuper && (
                    <td className="py-2.5 pr-4 font-medium text-text">{s.user.username}</td>
                  )}
                  <td className="py-2.5 pr-4 text-muted">{fmtDateTime.format(s.createdAt)}</td>
                  <td className="py-2.5 pr-4 text-muted">{fmtDateTime.format(s.lastUsedAt)}</td>
                  <td className="py-2.5 pr-4 text-text">{s.ip ?? "—"}</td>
                  <td className="max-w-[240px] truncate py-2.5 text-muted" title={s.userAgent ?? ""}>
                    {s.userAgent || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        <h2 className="mb-2 text-lg font-bold text-text">¿Has perdido el móvil del 2FA?</h2>
        <p>
          Pide al superadmin que te resetee el 2FA desde <em>Usuarios</em>: tus
          sesiones se cerrarán y volverás a configurarlo en tu próximo inicio de
          sesión. Si necesitas cambiar tu contraseña, también se hace desde ahí.
        </p>
      </section>
    </main>
  );
}
