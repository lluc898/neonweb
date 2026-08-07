import { NextResponse, type NextRequest } from "next/server";

/**
 * Capa de defensa en el borde para /admin (la validación REAL de la sesión
 * se hace en servidor con requireAdmin(); esto añade):
 * - Redirección temprana a /admin/login si no hay cookie de sesión.
 * - Cabeceras de seguridad: sin indexación, sin iframes (clickjacking),
 *   sin caché de páginas del panel.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const hasSessionCookie = request.cookies.has("nls_admin_session");

  if (!isLogin && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
