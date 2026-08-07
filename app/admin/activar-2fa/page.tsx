import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { beginTotpEnrollment, getSession } from "@/lib/admin-auth";
import { confirmTotpAction, logoutAction } from "../actions";

export const metadata = { title: "Activar 2FA" };

export default async function Activar2FAPage({
  searchParams,
}: PageProps<"/admin/activar-2fa">) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.pendingTotp) redirect("/admin"); // ya lo tiene activo
  const { error } = await searchParams;

  const { secret, uri } = await beginTotpEnrollment(session.user);
  const qrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 220 });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-12">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Hola, {session.user.username} 👋
      </h1>
      <p className="mt-2 text-sm text-muted">
        Antes de entrar al panel debes activar la <strong className="text-text">verificación
        en dos pasos</strong>. Es obligatoria para todos los usuarios: sin el código de tu
        móvil, tu contraseña sola no sirve para entrar.
      </p>

      <div className="mt-8 grid gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en servidor */}
          <img
            src={qrDataUrl}
            alt="Código QR para tu app de autenticación"
            className="rounded-lg border border-border bg-white p-2"
          />
          <p className="max-w-[220px] text-center text-xs text-muted">
            Google Authenticator, Authy, 1Password…
          </p>
        </div>

        <div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Instala una app de autenticación en tu móvil si no la tienes.</li>
            <li>Escanea el QR (o introduce esta clave a mano):
              <code className="mt-1 block w-fit break-all rounded bg-bg px-2 py-1 text-xs text-text">
                {secret}
              </code>
            </li>
            <li>Escribe el código de 6 dígitos que te muestra:</li>
          </ol>

          <form action={confirmTotpAction} className="mt-4 flex items-center gap-3">
            <input
              type="text"
              name="code"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              className="w-32 rounded-lg border border-border bg-bg px-4 py-2.5 tracking-[0.3em] text-text outline-none focus:border-neon-cyan"
            />
            <button className="rounded-full bg-neon-cyan px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_0_14px_rgba(41,171,226,0.5)]">
              Activar y entrar
            </button>
          </form>
          {error && (
            <p className="mt-3 text-sm text-neon-magenta">
              Código incorrecto. Comprueba la hora del móvil y prueba de nuevo.
            </p>
          )}
        </div>
      </div>

      <form action={logoutAction} className="mt-6 text-center">
        <button className="text-xs text-muted hover:text-neon-magenta">
          Salir y hacerlo en otro momento
        </button>
      </form>
    </main>
  );
}
