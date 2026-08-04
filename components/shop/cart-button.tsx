"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Lee el nº de artículos del carrito (localStorage) y se actualiza en vivo. */
export function CartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("neon_cart");
        setCount(raw ? JSON.parse(raw).length : 0);
      } catch {
        setCount(0);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("cart-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("cart-updated", read);
    };
  }, []);

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito${count > 0 ? ` (${count})` : ""}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-text transition-colors hover:text-neon-cyan"
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3.5h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            // key={count}: se re-monta en cada cambio → "pop" al añadir
            key={count}
            initial={{ scale: 0.4, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 550, damping: 16 }}
            className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neon-magenta px-1 text-[11px] font-bold leading-none text-white shadow-[0_0_8px_rgba(236,30,140,0.7)]"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
