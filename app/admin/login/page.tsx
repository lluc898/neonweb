import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { loginAction } from "../actions";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Acceso al panel
      </h1>
      <p className="mt-1 text-sm text-muted">Introduce la contraseña de administración.</p>

      <form action={loginAction} className="mt-6 space-y-4">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Contraseña"
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text outline-none transition-colors focus:border-neon-cyan"
        />
        {error && (
          <p className="text-sm text-neon-magenta">Contraseña incorrecta. Prueba de nuevo.</p>
        )}
        <button className="h-12 w-full rounded-full bg-neon-cyan text-sm font-semibold text-bg shadow-[0_0_16px_rgba(41,171,226,0.5)] transition-shadow hover:shadow-[0_0_28px_rgba(41,171,226,0.8)]">
          Entrar
        </button>
      </form>
    </main>
  );
}
