import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Facilita el self-host en el servidor Ubuntu + nginx (bundle autocontenido).
  output: "standalone",
  // Evita que Next.js sobrescriba/añada reglas a nuestro CLAUDE.md.
  agentRules: false,
  experimental: {
    serverActions: {
      // Subida de imágenes (diseño a medida) vía server action: hasta ~8 MB.
      bodySizeLimit: "8mb",
    },
  },
  images: {
    // Formatos modernos para no cargar el ancho de banda.
    formats: ["image/avif", "image/webp"],
    // Cuando sirvamos imágenes desde Supabase Storage, añadir aquí su hostname:
    // remotePatterns: [{ protocol: "https", hostname: "<tu-proyecto>.supabase.co" }],
  },
};

export default nextConfig;
