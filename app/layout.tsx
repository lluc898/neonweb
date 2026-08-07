import type { Metadata } from "next";
import { Geist, Poppins, Pacifico } from "next/font/google";
import "./globals.css";

// Cuerpo / UI
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Titulares / display
const poppins = Poppins({
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

// Acento de marca tipo "script" (como el "Spain" del logo), uso escaso
const pacifico = Pacifico({
  variable: "--font-script",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Neon Led Spain — Neones LED y neones personalizados",
    template: "%s · Neon Led Spain",
  },
  description:
    "Neones LED decorativos y personalizados hechos en España. Diseña tu neón a medida con nuestro configurador en vivo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${poppins.variable} ${pacifico.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
