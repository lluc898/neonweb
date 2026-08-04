"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartButton } from "@/components/shop/cart-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/productos", label: "Catálogo" },
  { href: "/personalizar", label: "Personaliza" },
  { href: "/diseno-a-medida", label: "Diseño a medida" },
];

/** Wordmark tipográfico: evoca el logo sin usar el emblema (ilegible en pequeño). */
function Wordmark() {
  return (
    <Link href="/" aria-label="Neon Led Spain — inicio" className="group flex items-baseline gap-1.5">
      <span className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase tracking-tight text-text">
        Neon<span className="ml-1 text-neon-cyan transition-[text-shadow] group-hover:[text-shadow:0_0_10px_rgba(41,171,226,0.8)]">Led</span>
      </span>
      <span className="font-[family-name:var(--font-script)] text-xl leading-none text-neon-yellow [text-shadow:0_0_10px_rgba(242,226,10,0.45)]">
        Spain
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Wordmark />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-[13px] font-medium uppercase tracking-wide transition-colors",
                  active ? "text-text" : "text-muted hover:text-text"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute -bottom-1.5 left-0 h-px w-full bg-neon-cyan shadow-[0_0_8px_rgba(41,171,226,0.9)] transition-transform duration-300 origin-left",
                    active ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/personalizar"
            className="hidden h-9 items-center rounded-full bg-neon-magenta px-4 text-[13px] font-semibold text-white shadow-[0_0_14px_rgba(236,30,140,0.45)] transition-shadow hover:shadow-[0_0_22px_rgba(236,30,140,0.75)] sm:inline-flex"
          >
            Diseña el tuyo
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
