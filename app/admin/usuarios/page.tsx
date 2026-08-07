import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin-auth";
import {
  createUserAction,
  resetUserPasswordAction,
  resetUserTotpAction,
  setUserActiveAction,
} from "../actions";

export const metadata = { title: "Usuarios" };

const fmtDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

const OK_MESSAGES: Record<string, string> = {
  created: "Usuario creado. Pásale sus credenciales: configurará su 2FA en el primer inicio de sesión.",
  password: "Contraseña actualizada y sesiones de ese usuario cerradas.",
  totp: "2FA reseteado: ese usuario volverá a configurarlo en su próximo inicio de sesión.",
};

const ERROR_MESSAGES: Record<string, string> = {
  username: "Nombre de usuario no válido (3-30 caracteres: minúsculas, números, . _ -).",
  password: "La contraseña debe tener al menos 10 caracteres.",
  exists: "Ya existe un usuario con ese nombre.",
};

export default async function AdminUsuariosPage({
  searchParams,
}: PageProps<"/admin/usuarios">) {
  const session = await requireSuperadmin();
  const { ok, error } = await searchParams;

  const users = await prisma.adminUser.findMany({
    orderBy: [{ isSuperadmin: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { sessions: true } } },
  });

  return (
    <main className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Usuarios del panel
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cada trabajador tiene su usuario, contraseña y su propio 2FA (obligatorio
          en el primer inicio de sesión).
        </p>
      </div>

      {ok && (
        <p className="rounded-lg border border-neon-cyan/40 bg-neon-cyan/5 px-4 py-3 text-sm text-neon-cyan">
          ✓ {OK_MESSAGES[String(ok)] ?? "Hecho."}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-neon-magenta/40 bg-neon-magenta/5 px-4 py-3 text-sm text-neon-magenta">
          {ERROR_MESSAGES[String(error)] ?? "Algo ha fallado."}
        </p>
      )}

      {/* Alta de usuario */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-text">Crear usuario</h2>
        <form action={createUserAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Usuario
            </span>
            <input
              type="text"
              name="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9._\-]+"
              placeholder="maria"
              autoCapitalize="none"
              className="w-44 rounded-lg border border-border bg-bg px-4 py-2.5 text-text outline-none focus:border-neon-cyan"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Contraseña inicial
            </span>
            <input
              type="text"
              name="password"
              required
              minLength={10}
              placeholder="mín. 10 caracteres"
              className="w-56 rounded-lg border border-border bg-bg px-4 py-2.5 text-text outline-none focus:border-neon-cyan"
            />
          </label>
          <button className="rounded-full bg-neon-cyan px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_0_14px_rgba(41,171,226,0.5)]">
            Crear
          </button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Entrega el usuario y la contraseña al trabajador. En su primer inicio de
          sesión se le pedirá escanear su QR y activar el 2FA en su móvil.
        </p>
      </section>

      {/* Lista de usuarios */}
      <section className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-text">{u.username}</span>
              {u.isSuperadmin && (
                <span className="rounded-full bg-neon-yellow/15 px-2 py-0.5 text-xs font-bold uppercase text-neon-yellow">
                  Superadmin
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                  u.active ? "bg-neon-cyan/15 text-neon-cyan" : "bg-neon-magenta/15 text-neon-magenta"
                }`}
              >
                {u.active ? "Activo" : "Desactivado"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                  u.totpSecret ? "bg-neon-cyan/15 text-neon-cyan" : "bg-neon-yellow/15 text-neon-yellow"
                }`}
              >
                {u.totpSecret ? "2FA activo" : "2FA pendiente"}
              </span>
              <span className="ml-auto text-xs text-muted">
                Alta: {fmtDate.format(u.createdAt)} · Sesiones: {u._count.sessions}
              </span>
            </div>

            {u.id !== session.user.id && !u.isSuperadmin && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
                {/* Activar / desactivar */}
                <form action={setUserActiveAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={String(!u.active)} />
                  <button
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      u.active
                        ? "border-neon-magenta/60 text-neon-magenta hover:bg-neon-magenta/10"
                        : "border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10"
                    }`}
                  >
                    {u.active ? "Desactivar acceso" : "Reactivar acceso"}
                  </button>
                </form>

                {/* Reset 2FA */}
                <form action={resetUserTotpAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-neon-yellow hover:text-neon-yellow">
                    Resetear 2FA (móvil perdido)
                  </button>
                </form>

                {/* Reset contraseña */}
                <form action={resetUserPasswordAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input
                    type="text"
                    name="password"
                    minLength={10}
                    required
                    placeholder="nueva contraseña"
                    className="w-44 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text outline-none focus:border-neon-cyan"
                  />
                  <button className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-neon-cyan hover:text-neon-cyan">
                    Cambiar contraseña
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
