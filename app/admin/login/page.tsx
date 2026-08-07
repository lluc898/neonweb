import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin-auth";
import { loginAction } from "../actions";

const ERRORS: Record<string, string> = {
  "bad-credentials": "Usuario o contraseña incorrectos.",
  "bad-totp": "Código de verificación incorrecto.",
  "totp-required": "Introduce el código de tu app de autenticación.",
  locked: "Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.",
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const session = await getSession();
  if (session) redirect(session.pendingTotp ? "/admin/activar-2fa" : "/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Acceso restringido
      </h1>
      <p className="mt-1 text-sm text-muted">
        Panel de administración de Neon Led Spain.
      </p>

      <form action={loginAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Usuario
          </span>
          <input
            type="text"
            name="username"
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors focus:border-neon-cyan"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Contraseña
          </span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors focus:border-neon-cyan"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Código 2FA
          </span>
          <input
            type="text"
            name="totp"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 tracking-[0.4em] text-text outline-none transition-colors placeholder:tracking-normal placeholder:text-muted/50 focus:border-neon-cyan"
          />
          <span className="mt-1 block text-xs text-muted">
            Si aún no has configurado el 2FA, déjalo vacío.
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-neon-magenta/40 bg-neon-magenta/5 px-4 py-3 text-sm text-neon-magenta">
            {ERRORS[String(error)] ?? "No se pudo iniciar sesión."}
          </p>
        )}

        <button className="h-12 w-full rounded-full bg-neon-cyan text-sm font-semibold text-bg shadow-[0_0_16px_rgba(41,171,226,0.5)] transition-shadow hover:shadow-[0_0_28px_rgba(41,171,226,0.8)]">
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        El acceso queda registrado. Los intentos fallidos repetidos bloquean la IP.
      </p>
    </main>
  );
}
