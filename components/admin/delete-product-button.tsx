"use client";

import { useState } from "react";

/**
 * Borrado en dos pasos: el primer clic arma la acción y el segundo la ejecuta.
 * Se evita a propósito `window.confirm`, que bloquea el hilo y queda pobre en
 * un panel. Si el producto está en algún pedido, la server action lo rechaza.
 */
export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Eliminar ${name}`}
        className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-neon-magenta hover:text-neon-magenta"
      >
        Eliminar
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        className="rounded-full bg-neon-magenta px-3.5 py-1.5 text-xs font-semibold text-white"
        aria-label={`Confirmar borrado de ${name}`}
      >
        Sí, eliminar
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-xs text-muted transition-colors hover:text-text"
      >
        Cancelar
      </button>
    </span>
  );
}
