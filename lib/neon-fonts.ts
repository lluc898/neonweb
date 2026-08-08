/**
 * Fuentes del configurador de neón.
 * Se aplican solo en las rutas que renderizan neones personalizados
 * (/personalizar y /carrito) para no penalizar el resto de la web.
 * Cada variable CSS se referencia desde lib/neon-options.ts (NEON_FONTS).
 */
import {
  Monoton,
  Righteous,
  Pacifico,
  Kaushan_Script,
  Great_Vibes,
  Permanent_Marker,
  Lobster,
  Sacramento,
  Bungee,
  Audiowide,
  Satisfy,
  Yellowtail,
  Cookie,
  Dancing_Script,
  Caveat,
  Bebas_Neue,
  Orbitron,
  Shadows_Into_Light,
} from "next/font/google";

// Estáticas (peso 400)
const monoton = Monoton({ weight: "400", subsets: ["latin"], variable: "--font-neon-monoton" });
const righteous = Righteous({ weight: "400", subsets: ["latin"], variable: "--font-neon-righteous" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-neon-pacifico" });
const kaushan = Kaushan_Script({ weight: "400", subsets: ["latin"], variable: "--font-neon-kaushan" });
const vibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-neon-vibes" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-neon-marker" });
const lobster = Lobster({ weight: "400", subsets: ["latin"], variable: "--font-neon-lobster" });
const sacramento = Sacramento({ weight: "400", subsets: ["latin"], variable: "--font-neon-sacramento" });
const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-neon-bungee" });
const audiowide = Audiowide({ weight: "400", subsets: ["latin"], variable: "--font-neon-audiowide" });
const satisfy = Satisfy({ weight: "400", subsets: ["latin"], variable: "--font-neon-satisfy" });
const yellowtail = Yellowtail({ weight: "400", subsets: ["latin"], variable: "--font-neon-yellowtail" });
const cookie = Cookie({ weight: "400", subsets: ["latin"], variable: "--font-neon-cookie" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-neon-bebas" });
const shadows = Shadows_Into_Light({ weight: "400", subsets: ["latin"], variable: "--font-neon-shadows" });

// Variables
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-neon-dancing" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-neon-caveat" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-neon-orbitron" });

/** Clase que agrupa todas las variables de fuente del configurador. */
export const configuratorFontVars = [
  monoton, righteous, pacifico, kaushan, vibes, marker,
  lobster, sacramento, bungee, audiowide, satisfy, yellowtail,
  cookie, bebas, shadows, dancing, caveat, orbitron,
]
  .map((f) => f.variable)
  .join(" ");
