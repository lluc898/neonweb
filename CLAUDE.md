# CLAUDE.md — Neon Led Spain

Guía maestra del proyecto para Claude Code. Lee este archivo antes de generar código. Aquí está la arquitectura, el stack, el sistema de diseño y las reglas del negocio. Manténlo actualizado cuando cambien decisiones importantes.

---

## 1. Qué estamos construyendo

Tienda online (e-commerce) de **Neon Led Spain**, una empresa de Mallorca que vende **neones LED** decorativos y, sobre todo, **neones personalizados**.

**La pieza más importante del proyecto es el configurador de neón personalizado.** Debe ser el mejor del sector: preview en vivo, precio en tiempo real y una experiencia fluida. Todo lo demás (catálogo, checkout, admin) gira alrededor de eso.

Dos vías de personalización:
1. **Configurador de texto**: el cliente escribe su texto y ve el neón encenderse en vivo (fuente, color, tamaño, soporte).
2. **Sube tu imagen / diseño a medida**: el cliente sube una imagen o idea y nosotros hacemos el diseño. Debe indicar el tamaño deseado con un selector para que podamos presupuestar y hacernos una idea.

Existe una web actual (`https://neonledspain.com/`) que este proyecto **sustituye y mejora**. La usamos como referencia de contenido (FAQ, contacto, categorías), pero el diseño y la personalización son nuevos y superiores.

### Datos del negocio (reales)
- **Empresa:** Neon Led Spain
- **Teléfono:** 627 65 22 02
- **Email:** hola@neonledspain.com
- **Dirección:** Carrer Licorers nº33, Polígono de Marratxí, Mallorca
- **Rango de precio de catálogo actual:** ~190 € – 410 €
- **Categorías:** Bodas · Cumpleaños · Frases famosas · Dibujos e iconos · Personalizado · (Negocios/comercial)

---

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | **Next.js 15 (App Router) + TypeScript** | Full-stack: frontend + API routes en un solo proyecto |
| UI / estilos | **Tailwind CSS + shadcn/ui** | Componentes accesibles y consistentes |
| Animación | **Framer Motion** | Transiciones y efectos de "encendido" de neón |
| Base de datos | **PostgreSQL vía Supabase** | Datos relacionales |
| ORM | **Prisma** | Esquema declarativo, migraciones |
| Auth | **Supabase Auth** | Clientes + rol admin (RBAC) |
| Almacenamiento | **Supabase Storage** | Imágenes de producto y subidas de clientes (diseños a medida) |
| Pagos | **Stripe** | Checkout + webhooks. **Aplazado**: se integra al final del proyecto |
| Emails | **Resend** | Confirmaciones de pedido y avisos |
| Hosting (dev) | **Servidor propio Ubuntu + nginx** | Self-host con `next start` detrás de nginx (reverse proxy) |
| Hosting (futuro) | Hosting profesional | Se migrará cuando el proyecto esté listo |
| Backend | **Supabase** | Datos, auth y almacenamiento |

> Decisión tomada: **todo por Supabase** de momento (datos, auth y almacenamiento). Si el ancho de banda de imágenes aprieta, se migran las imágenes a Cloudinary sin tocar el resto.
>
> **Deploy**: el usuario despliega en su propio servidor Ubuntu con nginx. Usar `output: "standalone"` en `next.config` para facilitar el self-host. No dependemos de features exclusivas de Vercel.
>
> **Pagos**: Stripe se integra en la última fase. Hasta entonces el checkout puede quedar como flujo sin cobro real / solicitud.

### Reglas de stack
- **No añadir dependencias** nuevas sin justificarlo. Preferir lo que ya está.
- Todo en **TypeScript estricto**. Nada de `any` sin comentario que lo justifique.
- **Server Components por defecto**; usar `"use client"` solo donde haga falta interactividad (configurador, carrito, admin).
- Lógica sensible (precios, pedidos, pagos) **siempre en el servidor**. El cliente nunca fija el precio final.

---

## 3. Arquitectura

Aplicación monolítica Next.js. El backend son Route Handlers y Server Actions dentro del mismo proyecto.

```
Cliente (navegador)
      │
      ▼
Next.js en Vercel
 ├── Rutas públicas (tienda)
 ├── Configurador de neón  ⭐ (client component + cálculo de precio en servidor)
 ├── Checkout (Stripe)
 ├── Área de cliente (mis pedidos)
 ├── /admin (protegido por rol)
 └── /api  → webhooks Stripe, subida de imágenes, cálculo de precio
      │
      ▼
Supabase  (Postgres + Auth + Storage)
Stripe    (pagos)
Resend    (emails)
```

### Flujo de un pedido personalizado
1. Cliente configura el neón (texto/color/tamaño/soporte) **o** sube una imagen + tamaño deseado.
2. El precio se calcula **en el servidor** a partir de las reglas de precio (ver §6).
3. Se añade al carrito guardando la **ficha completa de personalización** (todos los parámetros + URL de imagen si la hay).
4. Checkout con Stripe. El webhook confirma el pago y crea el pedido en estado `nuevo`.
5. El pedido aparece en `/admin` con toda la ficha de producción para fabricarlo.
6. Emails automáticos de confirmación y de cambios de estado.

---

## 4. Estructura de carpetas (objetivo)

```
/app
  /(shop)            # tienda pública
    /page.tsx        # home
    /productos       # catálogo + detalle
    /personalizar    # ⭐ configurador de texto
    /diseno-a-medida # subir imagen + tamaño
    /carrito
    /checkout
    /faq
    /contacto
  /(account)         # área de cliente
    /pedidos
  /admin             # panel de administración (protegido)
    /pedidos
    /productos
    /precios         # reglas de precio por tamaño
  /api               # route handlers (stripe webhook, uploads, pricing)
/components
  /ui                # shadcn
  /neon              # componentes del efecto neón y configurador
/lib                 # prisma, supabase, stripe, pricing, utils
/prisma              # schema.prisma + migraciones
/public              # assets estáticos (logo, etc.)
```

---

## 5. Sistema de diseño

**Objetivo: minimalista y moderno, pero inequívocamente "de neones".** Limpio y profesional como una buena tienda, con el brillo de neón como acento — no un carnaval de luces. El producto es el que brilla; la interfaz lo enmarca.

### Principios
- **Fondo oscuro por defecto** (los neones necesitan oscuridad para brillar). Es la identidad, no una opción de tema.
- **Mucho espacio en negro/vacío.** Minimalismo: pocos elementos, bien colocados.
- **El color neón es acento**, no relleno: bordes que brillan al hover, títulos con glow sutil, CTAs encendidos. El grueso del texto es blanco/gris legible.
- **Tipografía nítida** para leer + un toque de fuente "neón/script" solo para acentos de marca.
- **Rendimiento primero.** Nada de vídeos pesados de fondo (el `animacion.mp4` del repo es solo referencia, NO usarlo: ralentiza la carga). Los efectos se hacen con CSS/Canvas.

### Paleta (extraída del logo)
```
--bg:            #0A0A0F   (negro azulado, fondo base)
--surface:       #14141B   (tarjetas/superficies)
--text:          #F5F5F7   (texto principal)
--text-muted:    #A0A0A
--neon-cyan:     #29ABE2   (acento primario)
--neon-magenta:  #EC1E8C   (acento / CTAs)
--neon-yellow:   #F2E20A   (acento de marca, escaso)
```
Cian y magenta son los colores dominantes de marca; el amarillo es un guiño puntual (como el "Spain" del logo). Usar máximo 1–2 colores neón por vista para no saturar.

### Efecto neón (técnica)
- Glow con capas de `text-shadow` / `box-shadow` (varias sombras del mismo color con blur creciente).
- Animaciones de "encendido" y parpadeo sutil con CSS keyframes / Framer Motion, **con moderación**.
- Respetar `prefers-reduced-motion`: si el usuario lo pide, sin parpadeos.
- Encapsular esto en componentes reutilizables (`<NeonText>`, `<NeonBorder>`) en `/components/neon`.

### Marca y assets
- Logo: `logo.webp` (en el repo). "NEON LED" en blanco, "Spain" en script amarillo, triángulo cian+magenta.
- **Estados de carga** (loaders, skeletons) con temática neón: p. ej. un tubo de neón que se "enciende" progresivamente, o skeletons con leve pulso de glow. Deben sentirse parte de la marca.
- Microinteracciones: hover que "enciende" el elemento.

---

## 6. ⭐ Configurador de neón personalizado (la joya)

Debe ser **el mejor del sector**. Dos modos:

### Modo A — Configurador de texto (preview en vivo)
Controles del cliente:
- **Texto** (una o varias líneas).
- **Fuente**: varias tipografías tipo neón/script (curadas, no infinitas).
- **Color del neón**: paleta de colores LED reales disponibles.
- **Tamaño**: selector de anchos/altos disponibles (S/M/L/XL o cm).
- **Soporte/fondo**: tipo de acrílico/base (recorte, rectángulo, etc.).
- **Uso**: pared / colgar / sobremesa (afecta a montaje).

Comportamiento:
- **Preview en vivo**: el texto se renderiza con el efecto neón, fuente y color elegidos, en tiempo real (Canvas o DOM+CSS).
- **Precio en tiempo real**: recalcula al cambiar cualquier parámetro. El cálculo mostrado es indicativo; el **precio final se valida en el servidor** antes de pagar.
- Al añadir al carrito se guarda la **ficha completa** (texto, fuente, color, medidas, soporte, uso) → es la orden de producción.

### Modo B — Diseño a medida (sube tu imagen)
- El cliente **sube una imagen** (logo, boceto, foto) a Supabase Storage.
- Indica el **tamaño deseado con un selector** (para que podamos hacernos una idea y presupuestar).
- Campo de notas/descripción de cómo lo quiere.
- Genera una **solicitud de presupuesto** que llega al admin (no es compra directa; se revisa y se cotiza).

### Reglas de precio (configurables desde el admin)
El precio NO está hardcodeado. Se calcula a partir de reglas que el **admin puede ajustar** (ver §7):
- Precio base por **tamaño** (el eje principal, según lo pedido).
- Posibles modificadores: nº de caracteres/longitud del tubo, nº de colores, tipo de soporte, uso exterior, etc.
- La función de pricing vive en `/lib/pricing.ts` y se ejecuta **en el servidor**. El configurador la llama vía API para mostrar el precio; el checkout la vuelve a ejecutar para el precio real.

---

## 7. Panel de administración (`/admin`)

Protegido por rol admin (Supabase Auth + RBAC). Todo dentro del mismo Next.js.

Funciones:
- **Pedidos**: listado con estados (`nuevo → en_producción → enviado → entregado`, + `cancelado`). Ver la ficha de producción completa de cada personalizado (incluida imagen subida en diseños a medida).
- **Solicitudes de presupuesto** (diseños a medida): revisar imagen + tamaño, responder/cotizar.
- **Productos (CRUD)**: alta/edición de neones del catálogo, con imágenes, categorías, variantes y precios.
- **Herramienta de personalización interna**: para **crear/añadir nuestros propios neones al catálogo** usando el mismo configurador (diseñamos el neón y lo publicamos como producto).
- **Reglas de precio**: ajustar el **precio por tamaño** y modificadores del configurador (ver §6). Es un requisito explícito: el admin controla el precio por tamaño sin tocar código.

---

## 8. Modelo de datos (borrador Prisma)

Punto de partida; se refina al implementar.

- **User** (rol: `customer` | `admin`)
- **Product** (nombre, slug, descripción, categoría, precioBase, imágenes[], activo)
- **ProductVariant** (tamaño, color, precio) — para catálogo
- **Category** (bodas, cumpleaños, frases, iconos, personalizado, negocios)
- **PricingRule** (parámetro: tamaño/longitud/colores/soporte, valor, modificador) — editable por admin
- **CartItem / Cart** (puede contener una `customization` JSON)
- **Order** (usuario, estado, total, dirección envío, stripePaymentId, fecha)
- **OrderItem** (producto o `customization` JSON con la ficha de producción)
- **CustomRequest** (diseño a medida: imagenUrl, tamañoDeseado, notas, estado, presupuesto)
- **SiteSetting** (clave → JSON: ajustes de tienda editables desde el admin; hoy `trustpilot`)

---

## 9. Convenciones de desarrollo

- **Idioma**: UI y contenido en **español**. Código, nombres de variables y comentarios técnicos en inglés; strings de cara al usuario en español (preparar para i18n si más adelante hace falta inglés).
- **Componentes**: pequeños y reutilizables. El efecto neón siempre vía componentes de `/components/neon`, nunca CSS suelto repetido.
- **Precios y pagos**: nunca confiar en el cliente. Validar/recalcular en servidor.
- **Imágenes**: optimizar (`next/image`), formatos modernos (webp/avif). Vigilar el ancho de banda de Supabase.
- **Accesibilidad**: contraste suficiente pese al fondo oscuro; respetar `prefers-reduced-motion`; textos alternativos.
- **SEO**: metadatos por página, ya que la tienda depende de ser encontrada en Google.
- **Secrets**: en variables de entorno (`.env.local`), nunca en el repo. Claves de Stripe/Supabase/Resend fuera de git.

### Comandos (se completan al montar el proyecto)
```
npm run dev        # desarrollo local
npm run build      # build de producción
npm run lint       # linter
npx prisma studio  # explorar la BD
npx prisma migrate dev
```

---

## 10. Roadmap por fases

1. **Andamiaje**: Next.js + Tailwind + shadcn + Prisma + Supabase + sistema de diseño (paleta, `<NeonText>`, `<NeonBorder>`, loaders). Home básica.
2. **⭐ Configurador de texto (Modo A)** con preview en vivo y precio en tiempo real — la pieza clave, cuanto antes.
3. **Catálogo**: productos, categorías, detalle.
4. **Carrito + Checkout (Stripe)** + emails.
5. **Diseño a medida (Modo B)**: subida de imagen + selector de tamaño + solicitud de presupuesto.
6. **Admin**: pedidos, productos, reglas de precio, herramienta interna de personalización.
7. **Contenido**: FAQ, contacto, políticas (nutrido de la web actual), pulido de SEO y rendimiento.

---

## 10.b Estado actual

- **Fase 1 (andamiaje) ✅**: Next.js 16 + Tailwind v4, sistema de diseño neón (`app/globals.css`), componentes `NeonText/NeonButton/NeonLoader`.
- **Portada orientada a conversión ✅ (v2)**: **hero tipográfico** (sin fotografía de fondo y **sin el emblema**: la cabecera ya lleva el wordmark y dos logotipos distintos en pantalla quedaban mal; el fondo es rejilla CSS muy tenue + dos resplandores radiales) → **tira horizontal de fotos reales** → **el configurador completo renderizado en la propia home** → **slider de catálogo** (`components/shop/product-slider.tsx`: scroll-snap nativo + flechas que se desactivan en los extremos + difuminado lateral) → "Así de fácil" (3 pasos) → categorías → banner de diseño a medida → ventajas + Trustpilot + contacto.
  - **Tira de fotos** `components/shop/photo-strip.tsx`: tarjetas **3:2** (la proporción nativa de los archivos, así no se recortan) en un carril horizontal con scroll-snap, flechas, difuminado lateral y **visor a tamaño completo** al pulsar (Escape / flechas / clic fuera; bloquea el scroll del body). El carril **sangra hasta el borde de la pantalla** pero alinea la primera foto con el contenedor vía `paddingInline: max(1.5rem, calc((100vw - 72rem) / 2))`. Deliberadamente **no** es un banner a pantalla completa: se busca que se lean como fotos reales del taller.
  - ⚠️ Las fuentes del configurador van con **`preload: false`** en `lib/neon-fonts.ts`: con 18 familias, precargarlas hundía la portada. Se descargan solo al usarse (0 preloads en el HTML).
  - Sin reseñas ni cifras inventadas: solo afirmaciones reales del negocio.
  - **Trustpilot ✅ (editable desde el admin)**: `components/shop/trustpilot-rating.tsx` (variantes `inline` y `card`; estrellas con el verde de Trustpilot `#00B67A` — única excepción a la paleta). Aparece en el hero, en la sección de ventajas y en el footer, y **recibe los datos por props** desde `getTrustpilot()` (`lib/site-settings.ts`) → tabla **`SiteSetting`**, clave `trustpilot`. Se edita en **`/admin/trustpilot`** (puntuación, nº de opiniones, enlace y un interruptor para ocultar la insignia); al guardar hace `revalidatePath("/", "layout")` porque la insignia también vive en el footer.
    - La **etiqueta** (Excelente/Genial/Normal/…) **se calcula** del score (`trustpilotLabel`), no se escribe: así no puede contradecir a la nota.
    - `lib/trustpilot.ts` es framework-free (tipos + `TRUSTPILOT_DEFAULT` de fallback + `parseTrustpilot` que sanea el JSON de la BD). Lo importan admin y tienda.
    - ⚠️ **Trustpilot devuelve 403 a los bots**: no hay forma de sincronizar la nota. Se copia a mano de la ficha real; el aviso está puesto en la propia pantalla del admin. Si algún día hay cuenta Business, el **widget oficial (TrustBox)** sí se actualiza solo y sustituiría a todo esto.
  - **Imágenes de la galería**: fotografías genéricas de neones aportadas por el propietario, convertidas a WebP 1600×1067 (15,4 MB → 1,2 MB) con `sharp` y recorte inteligente. Se muestran **sin texto que afirme autoría** (alt neutro: "Rótulo de neón iluminado"). ⚠️ Pendiente de confirmar su licencia; sustituir por fotos propias en cuanto haya.
  - **Footer**: aquí sí va el emblema `logo.webp` (w-24) + insignia de Trustpilot.
- **Fase 2 (configurador Modo A) ✅ (v1)**: en `/personalizar`.
  - Opciones (fuentes, colores, tamaños, soportes, uso, fondos): `lib/neon-options.ts`.
  - **Fondos de la vista previa con foto real ✅**: `NEON_BACKDROPS` admite `image` (ruta en `public/fondos`) y `dim` (0–1, oscurecido encima de la foto — sin él las fotos son demasiado claras y el neón no destaca). El `style` CSS de cada fondo se mantiene: se ve mientras carga la foto y es la red de seguridad si el archivo faltase. **Estudio** (ciclorama de plató), **Ladrillo** (pared con foco cálido), **Salón** (pared verde con sofá) y **Hojas** (hiedra, para bodas) llevan foto; **Noche** sigue en CSS puro porque es un ambiente, no un lugar. ⚠️ En `NeonPreview` el texto necesita `relative`: la foto va en `absolute` y si no lo taparía.
    - **Licencia de estas fotos: Pexels** (uso comercial libre, sin atribución obligatoria) — a diferencia de `public/galeria`, cuya licencia sigue pendiente de confirmar. Originales recortados y convertidos a WebP 1600×1000 con `sharp` (22–240 KB). El encuadre vertical de cada foto se eligió a mano; si se sustituye alguna, hay que revisar que la zona central quede despejada para el texto.
  - Motor de precios PURO (cliente + servidor): `lib/pricing.ts`.
  - UI: `components/neon/neon-configurator.tsx` + `neon-preview.tsx`.
  - **Selector de soporte ilustrado ✅**: `components/neon/support-picker.tsx` — tarjetas (grid 2 col.) con mini-escena que dibujan **el texto real del cliente** con su acrílico detrás. Los cortes se simulan con el mismo glifo y `-webkit-text-stroke` + `paint-order: stroke fill`: **Corte a la forma** (stroke 8px = margen alrededor del diseño, gratis) y **Corte a la letra / ahuecado** (stroke 2.5px pegado al glifo, casi sin respaldo, +39 €); los paneles rect./redondeado llevan separadores. Al hover el acrílico entra (escala+opacidad) y lo recorre un destello (`.acrylic-shine`, keyframes en `globals.css`, desactivado con `prefers-reduced-motion`).
  - **CTA "¿Tienes un logo o diseño propio?"** junto al campo de texto → lleva a `/diseno-a-medida` (Modo B).
  - **Selector de color en 2 modos ✅**: `components/neon/color-picker.tsx` — tarjetas *Color fijo* / *RGB multicolor*; en modo fijo aparece un **desplegable** con la paleta (cierra con clic fuera o Escape, animado con Framer Motion). Recuerda el último color fijo al volver de RGB.
  - **Pricing v2 (fórmula del fabricante) ✅**: `precio = metros de tubo × €/m + m² material × €/m² (+RGB, soporte) × uso × entrega`, con pedido mínimo. Geometría estimada por tamaño (altura letra, ancho/letra, tubo/letra en `NEON_SIZES`). **Potencia (W)** estimada e informada en el panel (12 W/m, 14 RGB). **Color RGB multicolor** con suplemento (swatch conic-gradient; preview animada con `hue-rotate`, clase `.animate-rgb`). **Entrega**: estándar 3-5 días hábiles / ⚡ express 24-48 h con plus (multiplicador). Todo editable en `/admin/precios` (grupos PricingRule: SIZE con meta geométrica, RATE meter/m2/rgb/min/watts, DELIVERY, SUPPORT, USAGE). Los ítems del carrito guardan `specs` (tubeM, areaM2, watts) para la ficha de producción.
  - **Pendiente (fabricante)**: exportar **EPS a tamaño real trazado** por pedido — se añadirá a la ficha de producción del admin cuando exista el checkout (v1: descarga SVG a tamaño real con la fuente indicada; el trazado final se hace en Illustrator).
- **Fase 3 (catálogo) ✅ (v1)**:
  - Productos semilla en `lib/products.ts` (a sustituir por Supabase). 16 productos en 5 categorías.
  - Catálogo con filtro por categoría (`/productos`) + ficha de detalle con color/tamaño (`/productos/[slug]`, prerenderizada por SEO).
  - Tarjetas y detalle renderizan el diseño en neón (texto con glow o emoji), sin necesidad de fotos todavía.
- **Navegación común ✅**: `SiteHeader` (wordmark tipográfico — NO el emblema, ilegible en pequeño — + nav con estado activo + CTA + carrito SVG) y `SiteFooter` en el layout raíz. Contador de carrito en vivo (`CartButton`, evento `cart-updated`).
- **Carrito ✅ (v2, ficha profesional)**: `/carrito` lee `localStorage` (clave `neon_cart`) y muestra por ítem: **preview real del neón** (sobre `NeonStage`, con su fuente y color; las fuentes se cargan vía `lib/neon-fonts.ts`, compartido con `/personalizar`), **ficha de personalización** (tipografía, color, tamaño, soporte, uso, entrega), **ficha técnica** (m de tubo, m² de acrílico, W) y **desglose de precio desplegable**. Al añadir se guarda el `PriceBreakdown` completo en el ítem (`breakdown`); si falta —carritos antiguos— se recalcula con `DEFAULT_PRICING`. Sidebar con resumen, total y aviso de plazo (express o estándar). Botón de compra deshabilitado (pagos aplazados).
- **Páginas base**: `/faq` (contenido a revisar por el propietario), `/diseno-a-medida` (placeholder del Modo B).
- **Capa de datos ✅ (montada, pendiente de credenciales)**:
  - **Prisma 7** (generador nuevo `prisma-client`, ESM). Cliente generado en `lib/generated/prisma` (gitignored; se regenera con `postinstall`).
  - Usa **driver adapter** `@prisma/adapter-pg` (Prisma 7 lo exige) → conexión vía `pg`. Singleton en `lib/prisma.ts`.
  - Config en `prisma.config.ts` (carga `.env` con dotenv). Esquema en `prisma/schema.prisma` (modelos §8: Profile, Category, Product, PricingRule, Order, OrderItem, CustomRequest + enums). Precios en **céntimos** (`priceCents`).
  - Clientes Supabase en `lib/supabase/` (`client.ts` navegador/anon, `server.ts` service-role).
  - Seed idempotente en `prisma/seed.ts` (vuelca `lib/products.ts` + reglas de `lib/neon-options.ts` a la BD).
  - Variables en `.env.example`. Scripts: `db:migrate`, `db:seed`, `db:studio`.
  - **ACTIVO ✅**: Supabase conectado y poblado (5 categorías, 16 productos, 9 reglas de precio).
    - ⚠️ **Conexión**: la red del usuario es IPv4 y el host directo de Supabase (`db.<ref>.supabase.co:5432`) es **IPv6-only** → NO usar. Usar el **Session pooler**: `postgresql://postgres.<ref>:<pass>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`.
    - ⚠️ **Migraciones**: `prisma migrate dev` falla por la shadow DB (el pooler no permite CREATE DATABASE). Usar **`npx prisma db push`** para sincronizar el esquema. `db seed` funciona con normalidad.
    - Claves nuevas de Supabase (`sb_publishable_…` = anon, `sb_secret_…` = service_role) ya en `.env`.
- **Frontend conectado a la BD ✅**:
  - `lib/catalog.ts` (solo servidor): `getProducts/getCategories/getProductBySlug/getConfiguratorOptions`, con **fallback a los datos semilla** si la BD está vacía o caída.
  - `/productos` y `/productos/[slug]` leen de la BD (ISR `revalidate = 300`; el admin fuerza refresh con `revalidatePath`).
  - `/personalizar` carga las reglas de precio de la BD y las pasa a `NeonConfigurator` como prop `options`. `calcPrice(config, options)` acepta reglas dinámicas (`DEFAULT_PRICING` como fallback).
- **Panel de administración ✅ (v2, endurecido)** en `/admin`:
  - **Panel independiente**: la tienda vive en el route group `app/(shop)/` (con `SiteHeader/SiteFooter/CartToastHost` en su layout); el admin tiene su propio shell (`app/admin/layout.tsx`) con barra propia, nav y botón "Cerrar sesión". El layout raíz solo pone fuentes/body.
  - **Auth v3 — multi-usuario (lib/admin-auth.ts + lib/password.ts)**:
    - **`AdminUser`**: cada trabajador tiene usuario + contraseña (hash **scrypt**, formato `scrypt:N:r:p:salt:hash` — ⚠️ separador `:` porque el loader de .env de Next expande `$var`) + **su propio 2FA TOTP**.
    - **2FA OBLIGATORIO**: el primer login crea una sesión `pendingTotp` que solo permite `/admin/activar-2fa` (QR + clave manual, libs `otpauth` + `qrcode`); hasta confirmar el código no se entra al panel. Anti-replay por time-step y por usuario.
    - **Superadmin** (usuario `admin`, flag `isSuperadmin`): gestiona usuarios en `/admin/usuarios` — crear (contraseña inicial ≥10 chars), desactivar/reactivar, resetear contraseña y resetear 2FA (móvil perdido); todo cierra las sesiones del afectado. No puede desactivarse a sí mismo ni al superadmin.
    - **Bootstrap**: `prisma/seed.ts` crea el usuario `admin` (superadmin) con `ADMIN_PASSWORD_HASH` del `.env` si no existe. `ADMIN_PASSWORD_HASH` solo se usa para ese bootstrap.
    - **Sesiones en BD** (`AdminSession`, ligadas a usuario, cascade): token aleatorio 256-bit, solo se guarda su SHA-256; TTL 12 h; revocación individual, por usuario o total. Cookie `nls_admin_session` httpOnly + SameSite=strict + path=/admin + secure en prod. Un usuario desactivado pierde sesiones y login al instante.
    - **Rate-limiting persistido** (`AdminLoginAttempt`): 5 fallos/IP o 20 globales en 15 min → bloqueo (aunque luego aciertes). Anti-enumeración de usuarios (verificación dummy en tiempo ~constante). Auditoría con IP; poda > 30 días.
    - **`proxy.ts`** (middleware de Next 16) sobre `/admin/:path*`: redirect temprano sin cookie + cabeceras X-Frame-Options DENY, nosniff, no-referrer, no-store, X-Robots-Tag.
    - Flujo completo verificado E2E (12 casos: alta 2FA, gating de sesión pendiente, anti-replay, creación de usuario, desactivación…).
  - Secciones: **Resumen**, **Pedidos**, **Solicitudes**, **Productos**, **Precios**, **Opiniones** (Trustpilot), **Seguridad** (sesiones propias; todas si superadmin + botón pánico), **Usuarios** (solo superadmin).
  - Server actions en `app/admin/actions.ts`; tras cada cambio hacen `revalidatePath` de la página pública afectada → los cambios del admin se publican al instante.
- **Modo B (diseño a medida) ✅**:
  - `/diseno-a-medida`: formulario real → subida de imagen + selector de tamaño + notas + contacto → crea `CustomRequest` (gestionable en `/admin/solicitudes`). Estados ok/error vía query params.
  - Imágenes en Supabase Storage, bucket **`disenos`** (público, 6 MB máx, solo png/jpg/webp/svg). Creado con `scripts/setup-storage.mts` (idempotente; ejecutarlo en cada entorno nuevo).
  - La subida va por server action (`app/diseno-a-medida/actions.ts`) con la service key — el navegador nunca toca Storage. `experimental.serverActions.bodySizeLimit: "8mb"` en `next.config.ts`.
  - Flujo verificado E2E (upload → URL pública → fila BD → visible en admin).
- **Listas del admin mejoradas ✅**: controles compartidos en `components/admin/list-controls.tsx` (`StatusFilter` chips, `SearchBox` GET, `Pagination` por enlaces con query params `estado`/`q`/`pagina`).
  - **Solicitudes**: fecha/hora de recepción, imagen clicable (tamaño completo) + botón **Descargar** (usa el sufijo `?download=` de las URLs públicas de Supabase Storage), filtros por estado, búsqueda nombre/email (insensible a mayúsculas), paginación (10/página).
  - **Pedidos**: mismos filtros/búsqueda/paginación + hora en la cabecera.
  - **Catálogo público**: paginación client-side en `ProductCatalog` (12/página, números + ant/sig, se resetea al cambiar de categoría). Todo verificado E2E con datos de prueba.
- **Pulido visual del catálogo ✅**: `components/shop/neon-stage.tsx` — "escenario" de producto (pared de ladrillo CSS + resplandor ambiental del color del neón + viñeta + brillo extra al hover). Lo usan `ProductCard` y `ProductDetail` para que las previews parezcan fotos de producto y no se fundan con el fondo de la página. Regla de diseño: las previews de producto SIEMPRE sobre `NeonStage`, nunca sobre el fondo plano.
- **Carrito centralizado + animaciones ✅**: lógica única en `lib/cart.ts` (`addToCart/removeFromCart`, eventos `cart-updated` y `cart-added`). Los componentes lo leen con **`useSyncExternalStore`** (`subscribeCart/getCartSnapshot/getCartServerSnapshot`) — nada de `setState` dentro de efectos; el snapshot se cachea por el JSON crudo para mantener referencia estable (si no, bucle de renders). Animaciones con Framer Motion: badge del header hace "pop" (spring, re-mount por `key={count}`) y toast global `CartToastHost` (montado en el layout raíz; check SVG que se dibuja, autodescarte 3.8s, enlace a /carrito).
- **Checkout ✅ (sin pago todavía)**:
  - `/checkout`: formulario en 4 bloques (tipo de cliente **Particular/Empresa**, contacto, dirección de envío con facturación opcional, notas) + resumen fijo con subtotal/envío/total y aviso de envío gratis. `components/shop/checkout-form.tsx` con `useActionState`; los errores se pintan campo a campo.
  - **Lógica en `lib/checkout.ts`** (`submitOrder`, sin dependencias de Next → testeable de forma aislada); `app/(shop)/checkout/actions.ts` solo envuelve y hace `redirect`.
  - **Precios recalculados SIEMPRE en servidor** (`lib/order-pricing.ts`): del navegador solo se acepta la *configuración* de cada ítem; los importes se ignoran, las opciones se sanean contra las válidas y los productos de catálogo cogen su precio de la BD. Verificado E2E que un precio manipulado (1 cent) se recalcula al real.
  - **Validación española real** en `lib/validators.ts`: NIF/NIE con letra de control, CIF con dígito de control (numérico/letra según la inicial), CP 01-52, teléfono, email + listado de provincias.
  - **Envío**: coste y umbral de envío gratis en `PricingRule` grupo `SHIPPING` (editables desde el admin; por defecto 9,90 € y gratis desde 200 €).
  - **Pedido**: `Order` con referencia legible `NLS-AAAA-NNNN` (reintento ante colisión), tipo de cliente, razón social, NIF/CIF normalizado, direcciones JSON, notas, subtotal/envío/total y `OrderItem` con `customization` + `breakdown` (m de tubo, m², W) para producción.
  - Confirmación en `/pedido/[numero]` (vacía el carrito al montar) y admin `/admin/pedidos` ampliado (referencia, tipo de cliente, NIF, dirección, notas, ficha de fabricación; búsqueda también por nº de pedido y empresa).
- **EPS de producción ✅** (lo que pide el fabricante: "EPS a tamaño real trazado"):
  - Botón **Descargar EPS** en cada línea personalizada de `/admin/pedidos`; ruta `app/admin/pedidos/[itemId]/eps/route.ts` protegida con `isAdmin()` (verificado: anónimo→login, cookie falsa/caducada→401).
  - `lib/eps.ts`: descarga el **TTF** de Google Fonts (con el User-Agent de un Safari antiguo; con otros devuelve WOFF/EOT que opentype.js no lee) y lo cachea en disco (`tmpdir/nls-fonts`) + memoria.
  - **Texto trazado a curvas** (no requiere fuente instalada): composición **glifo a glifo con kerning** — se evita `font.getPath()` porque su motor de features (ccmp) revienta con algunas tipografías script (p. ej. Great Vibes). Cuadráticas elevadas a cúbicas y `closepath` explícito por contorno (estas fuentes no emiten `Z`); relleno `eofill` para respetar contrahuecos.
  - **Tamaño real**: la caja se calcula con la **tinta real** (`path.getBoundingBox()`), no con métricas — si no, ascendentes/descendentes y remates se salían del documento. Se escala a la altura de mayúscula del tamaño elegido y, si el rótulo excede el **ancho máximo** (`NeonSize.maxWidthCm`: 50/80/100/150 cm), se reduce proporcionalmente y se anota en la cabecera. Margen de 1 cm por lado.
  - Cabecera con ficha de producción (pedido, texto, tipografía, color, medidas reales, soporte, uso). Verificado en las **18 tipografías** y en casos límite (varias líneas, acentos, una letra, textos largos).
- **Pendiente inmediato**: pasarela de pago (Stripe); emails (Resend) al recibir solicitud/pedido; imágenes reales de producto; alta/edición completa de productos desde admin (hoy solo precio/visibilidad).

## 10.c Despliegue (servidor Ubuntu)

Producción en el servidor propio, en **`neonledspain.llucbosch.com`**.

| Dato | Valor |
|------|-------|
| Servidor | Ubuntu 24.04 · `192.168.1.200` (LAN) · `85.59.119.150` (pública, **sin IPv6**) |
| SSH | puerto **22000**, usuario `lluc` |
| Ruta de la app | `~/apps/neonweb` (clon de `github.com/lluc898/neonweb`) |
| Contenedor | `neonweb`, imagen `neonweb:latest`, `restart: always` |
| Puerto | `127.0.0.1:3000` (solo loopback) |
| Reverse proxy | **Nginx Proxy Manager** en Docker (`~/nginx-proxy-manager`), termina TLS |

- **Docker, no `next start` a pelo**: el servidor ya usa NPM + contenedores, así que la app va en Docker (`Dockerfile` multi-stage aprovechando `output: "standalone"` + `docker-compose.yml`). Estos ficheros están en la raíz del repo.
- **NPM proxea por nombre de contenedor**: `http://neonweb:3000`. El contenedor se une a la red externa **`nginx-proxy-manager_default`** (la que usa NPM de verdad; ojo, existe otra red `npm-network` huérfana que NPM **no** usa).
  - ⚠️ **No proxear por IP del host**: el firewall bloquea `192.168.1.200:3000` desde los contenedores. Solo funcionan los puertos abiertos explícitamente (p. ej. 18789, 20081).
- **Build con `.env`**: Next inlinea las `NEXT_PUBLIC_*` en tiempo de compilación, por eso el `.dockerignore` **deja pasar `.env`** a la etapa `builder`. No llega a la imagen final; el runtime lo recibe vía `env_file` de compose. El `.env` vive solo en el servidor (`chmod 600`), nunca en git.
- **Despliegue de cambios**: `cd ~/apps/neonweb && git pull && docker compose up -d --build`.

## 11. Notas y referencias

- **Web de referencia**: `https://neonledspain.com/` (contenido: FAQ, contacto, categorías). El diseño nuevo la supera.
- **Assets en repo**: `logo.webp` (usar), `animacion.mp4` (solo referencia, **NO** usar en la web por peso).
- Este archivo es la fuente de verdad de la arquitectura. Si tomamos una decisión importante nueva, actualízalo aquí.
- **Next.js 16**: versión reciente con cambios respecto a versiones anteriores. Ante dudas de API, consultar la doc en `node_modules/next/dist/docs/` antes de escribir código.
