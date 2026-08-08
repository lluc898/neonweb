import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Manual" };

/**
 * Manual de uso del panel, pensado para quien lleva la tienda día a día.
 *
 * Vive dentro del admin a propósito, y no como PDF suelto: así se actualiza
 * con cada despliegue, enlaza a cada pantalla y no hay copias desfasadas
 * circulando. Los estilos de impresión lo convierten en un PDF decente con
 * "Imprimir → Guardar como PDF" del navegador.
 */

/** CSS de impresión: fondo blanco, sin navegación y con los enlaces visibles. */
const PRINT_CSS = `
@media print {
  header, footer, .no-print { display: none !important; }
  :root { color-scheme: light; }
  body { background: #fff !important; color: #111 !important; }
  .manual, .manual * {
    background: transparent !important;
    color: #111 !important;
    border-color: #bbb !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .manual section { break-inside: avoid; }
  .manual h2 { break-after: avoid; page-break-after: avoid; }
  .manual a[href^="/"]::after { content: " (" attr(href) ")"; font-size: 0.85em; color: #555 !important; }
}
`;

type Step = { do: string; note?: string };

function Steps({ items }: { items: Step[] }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neon-cyan/50 text-[11px] font-bold text-neon-cyan">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed text-text">
            {s.do}
            {s.note && <span className="mt-0.5 block text-xs text-muted">{s.note}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Note({
  kind = "info",
  title,
  children,
}: {
  kind?: "info" | "warn" | "stop";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-neon-cyan/40 bg-neon-cyan/5 text-neon-cyan",
    warn: "border-neon-yellow/40 bg-neon-yellow/5 text-neon-yellow",
    stop: "border-neon-magenta/40 bg-neon-magenta/5 text-neon-magenta",
  }[kind];

  return (
    <div className={`mt-4 rounded-lg border px-4 py-3 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-text">
        {title}
      </h2>
      {lead && <p className="mt-1.5 text-sm text-muted">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 align-top">
              {r.map((cell, j) => (
                <td key={j} className={`px-3 py-2.5 ${j === 0 ? "text-text" : "text-muted"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const INDEX = [
  ["que-es", "Qué es cada cosa"],
  ["entrar", "Entrar en el panel"],
  ["pedidos", "Pedidos: del aviso al taller"],
  ["eps", "Descargar el EPS de producción"],
  ["solicitudes", "Solicitudes de diseño a medida"],
  ["productos", "Productos del catálogo"],
  ["nuevo-producto", "Crear un producto nuevo"],
  ["svg", "Preparar bien un SVG"],
  ["precios", "Precios"],
  ["opiniones", "Opiniones de Trustpilot"],
  ["usuarios", "Usuarios y seguridad"],
  ["cliente", "Lo que ve el cliente"],
  ["limites", "Lo que todavía NO hace la web"],
] as const;

export default async function AdminManualPage() {
  await requireAdmin();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <main className="manual mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Manual de la tienda
          </h1>
          <p className="mt-2 text-muted">
            Todo lo que hay que saber para llevar Neon Led Spain: atender pedidos,
            mandar diseños al taller, dar de alta productos y tocar precios.
          </p>
          <p className="no-print mt-3 text-xs text-muted">
            ¿Lo quieres en papel o en PDF? Pulsa <strong className="text-text">Ctrl+P</strong> y
            elige «Guardar como PDF»: esta página tiene formato de impresión.
          </p>
        </div>

        {/* Índice */}
        <nav className="mb-10 rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Contenido
          </p>
          <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {INDEX.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-muted transition-colors hover:text-neon-cyan">
                  <span className="tabular-nums text-text/50">{String(i + 1).padStart(2, "0")}</span>{" "}
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {/* ------------------------------------------------------------- */}
          <Section
            id="que-es"
            title="1. Qué es cada cosa"
            lead="La web tiene dos mitades: la tienda que ve el cliente y este panel."
          >
            <Table
              head={["Zona", "Para qué sirve"]}
              rows={[
                [
                  "La tienda",
                  "Catálogo, configurador de neón a medida, carrito y checkout. Es pública, no hace falta cuenta para comprar.",
                ],
                [
                  "El panel (/admin)",
                  "Donde trabajáis vosotros: pedidos, solicitudes, productos, precios y usuarios. Protegido con contraseña y 2FA.",
                ],
              ]}
            />

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Un cliente puede llegar a vosotros por <strong className="text-text">tres caminos</strong>{" "}
              distintos, y cada uno acaba en un sitio diferente del panel:
            </p>
            <Table
              head={["El cliente…", "Acaba en", "Se cobra"]}
              rows={[
                ["Compra un diseño del catálogo", <>Pedidos</>, "Sí (pedido cerrado)"],
                ["Diseña su neón en el configurador", <>Pedidos</>, "Sí (pedido cerrado)"],
                [
                  "Sube su logo en «Diseño a medida»",
                  <>Solicitudes</>,
                  "No: hay que presupuestarlo a mano",
                ],
              ]}
            />
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="entrar"
            title="2. Entrar en el panel"
            lead="Cada trabajador tiene su usuario. No se comparten cuentas."
          >
            <Steps
              items={[
                { do: "Ve a /admin e introduce tu usuario y contraseña." },
                {
                  do: "La primera vez te pedirá configurar el 2FA.",
                  note: "Escanea el QR con Google Authenticator, Authy o similar (también puedes teclear la clave a mano). Hasta que no confirmes un código no entras al panel: es obligatorio para todos.",
                },
                {
                  do: "A partir de ahí, cada login pide usuario, contraseña y el código de 6 dígitos.",
                },
              ]}
            />

            <Note kind="warn" title="Si fallas la contraseña varias veces, te bloquea">
              A los 5 intentos fallidos desde tu conexión (o 20 en total) el acceso se bloquea 15
              minutos, aunque luego aciertes. Es a propósito. Espera y vuelve a intentarlo.
            </Note>

            <Note kind="info" title="La sesión dura 12 horas">
              Después caduca y hay que volver a entrar. Si pierdes el móvil del 2FA, el superadmin
              te lo resetea desde <Link href="/admin/usuarios" className="underline">Usuarios</Link>.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="pedidos"
            title="3. Pedidos: del aviso al taller"
            lead="Pantalla Pedidos. Es la que más vais a usar."
          >
            <p className="text-sm leading-relaxed text-muted">
              Cada pedido tiene una referencia tipo <strong className="text-text">NLS-2026-0001</strong> y
              pasa por estos estados. Cámbialo con el desplegable de cada pedido según avance:
            </p>
            <Table
              head={["Estado", "Cuándo ponerlo"]}
              rows={[
                ["Nuevo", "Recién recibido. Todavía no lo habéis mirado."],
                ["En producción", "Confirmado y en el taller."],
                ["Enviado", "Ya ha salido hacia el cliente."],
                ["Entregado", "Recibido por el cliente. Fin."],
                ["Cancelado", "Anulado. No cuenta en la facturación del Resumen."],
              ]}
            />

            <p className="mt-5 text-sm font-semibold text-text">Qué encuentras en cada pedido</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>· Datos de contacto, si es particular o empresa, y su NIF/CIF.</li>
              <li>· Dirección de envío y, si la pidió distinta, la de facturación.</li>
              <li>· Notas que dejó el cliente.</li>
              <li>
                · <strong className="text-text">La ficha de producción</strong> de cada línea:
                texto, tipografía, color, tamaño, soporte y uso; y en los personalizados, los
                metros de tubo, los m² de acrílico y los vatios estimados.
              </li>
            </ul>

            <p className="mt-5 text-sm font-semibold text-text">Buscar un pedido</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Arriba tienes filtros por estado y un buscador. Busca por número de pedido, nombre,
              apellidos, empresa o email. Se muestran 10 por página.
            </p>

            <Note kind="stop" title="Ahora mismo la web NO cobra">
              La pasarela de pago está pendiente. El pedido se registra con todos sus datos, pero
              el cobro lo tenéis que gestionar vosotros (transferencia, Bizum, TPV…). Confirmadlo
              con el cliente antes de poner el pedido «En producción».
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="eps"
            title="4. Descargar el EPS de producción"
            lead="El archivo que se manda a fabricar, a tamaño real y con el diseño en curvas."
          >
            <p className="text-sm leading-relaxed text-muted">
              En cada línea de pedido hay un botón{" "}
              <strong className="text-text">⬇ Descargar EPS (tamaño real, trazado)</strong>. Funciona
              con los tres tipos de diseño:
            </p>
            <Table
              head={["Tipo de línea", "Qué sale en el EPS"]}
              rows={[
                [
                  "Neón personalizado",
                  "El texto del cliente convertido a curvas con su tipografía. La altura de mayúscula es la real contratada.",
                ],
                [
                  "Producto de catálogo vectorial",
                  "Los trazos del logo. El diseño se inscribe en el lado mayor del tamaño contratado (Gigante = 150 cm).",
                ],
                [
                  "Producto de catálogo con tipografía",
                  "Igual que un personalizado, con el texto y la fuente que guardasteis en el producto.",
                ],
              ]}
            />

            <p className="mt-4 text-sm leading-relaxed text-muted">
              El archivo lleva <strong className="text-text">1 cm de margen por lado</strong> y una
              cabecera con la ficha de producción (pedido, medidas reales, color, soporte, uso). Al
              ir trazado, <strong className="text-text">no hace falta tener la tipografía instalada</strong>{" "}
              para abrirlo.
            </p>

            <Note kind="warn" title="Si el texto es muy largo">
              El rótulo nunca supera el ancho máximo del tamaño contratado: si se pasa, el diseño
              se reduce en proporción y queda anotado en la cabecera del EPS. Míralo antes de
              cortar.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="solicitudes"
            title="5. Solicitudes de diseño a medida"
            lead="Pantalla Solicitudes. Aquí NO hay venta cerrada: hay que presupuestar."
          >
            <Steps
              items={[
                {
                  do: "Abre la solicitud y mira la imagen que subió el cliente.",
                  note: "Pulsa en la miniatura para verla a tamaño completo, o usa «Descargar» para bajarla al ordenador.",
                },
                {
                  do: "Comprueba el tamaño que pide y las notas que ha dejado.",
                },
                {
                  do: "Calcula el precio y escríbelo en el campo «Presupuesto €».",
                },
                {
                  do: "Cambia el estado a «Presupuestada» y guarda.",
                  note: "Después, según la respuesta del cliente, ponlo en «Aceptada» o «Rechazada».",
                },
                {
                  do: "Contacta tú con el cliente por email o teléfono.",
                  note: "La web no le manda nada automáticamente todavía.",
                },
              ]}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Tienes los mismos filtros por estado, buscador (por nombre o email) y paginación que
              en Pedidos.
            </p>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="productos"
            title="6. Productos del catálogo"
            lead="Pantalla Productos. Listado de todo lo que se vende hecho."
          >
            <p className="text-sm font-semibold text-text">Cambiar precio o esconder un producto</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              En cada fila puedes editar el <strong className="text-text">precio base</strong> y
              marcar o desmarcar <strong className="text-text">visible</strong>. Pulsa Guardar: el
              cambio sale en la tienda al instante.
            </p>

            <Note kind="info" title="Qué es el «precio base»">
              Es el precio del <strong>tamaño Mediano</strong>. Los demás tamaños se calculan solos
              a partir de él (Pequeño −40 €, Grande +70 €, Gigante +150 €). En el catálogo al
              cliente se le enseña el precio «desde», que es el de la talla pequeña.
            </Note>

            <p className="mt-5 text-sm font-semibold text-text">Eliminar un producto</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Botón <strong className="text-text">Eliminar</strong> a la derecha. Pide confirmación
              en el mismo sitio (hay que pulsar dos veces).
            </p>

            <Note kind="warn" title="No se puede borrar si ya se ha vendido">
              Si el producto aparece en algún pedido, el panel se niega a borrarlo y te dice en
              cuántos. Es a propósito: se perdería el rastro de lo que se vendió. En ese caso,
              desmarca <strong>visible</strong> y desaparece de la tienda conservando el histórico.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="nuevo-producto"
            title="7. Crear un producto nuevo"
            lead="Productos → + Nuevo producto. Hay dos formas de hacer el diseño."
          >
            <p className="text-sm font-semibold text-text">Opción A — Con el editor</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Para frases y nombres. Escribe el texto, elige una de las 18 tipografías (el selector
              te enseña cada una con su propia letra) y listo. Si dejas el texto vacío se usa el
              nombre del producto. También puedes poner un <strong className="text-text">emoji</strong>{" "}
              en vez de texto, para los diseños de icono (⚡ 🌙 🍸).
            </p>

            <p className="mt-5 text-sm font-semibold text-text">Opción B — Subir un vectorial</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Para logos. Arrastra un <strong className="text-text">SVG</strong> sobre el recuadro y
              se convierte solo en trazo de neón. Ajusta el{" "}
              <strong className="text-text">grosor del tubo</strong> con el deslizador hasta que te
              guste.
            </p>

            <p className="mt-5 text-sm font-semibold text-text">Después, rellena la ficha</p>
            <Steps
              items={[
                { do: "Nombre y categoría." },
                { do: "Descripción corta (la que lee el cliente en la ficha)." },
                {
                  do: "Precio base, o sea el del tamaño Mediano.",
                  note: "Debajo te muestra qué precio «desde» verá el cliente.",
                },
                {
                  do: "Color con el que se enseña en el catálogo.",
                  note: "Es solo el color por defecto: el cliente puede elegir cualquier otro, y también RGB multicolor.",
                },
                {
                  do: "Marca si quieres publicarlo ya y pulsa «Crear producto».",
                },
              ]}
            />

            <Note kind="info" title="Fíjate en la vista previa">
              El recuadro de la derecha usa exactamente el mismo dibujo que verá el cliente. Lo que
              ves ahí es lo que se publica.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="svg"
            title="8. Preparar bien un SVG"
            lead="La mayoría de problemas al subir un logo vienen de cómo se exportó."
          >
            <p className="text-sm font-semibold text-text">Desde Illustrator</p>
            <Steps
              items={[
                {
                  do: "Convierte el texto a curvas: Texto → Crear contorno (Mayús+Ctrl+O).",
                  note: "Si no, las letras no se suben: el sistema solo lee trazos.",
                },
                { do: "Archivo → Exportar → Exportar como… → SVG." },
                { do: "Arrastra el archivo al recuadro del panel." },
              ]}
            />

            <p className="mt-5 text-sm font-semibold text-text">
              De qué se encarga el sistema solo
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>
                · <strong className="text-text">Reencuadra y centra</strong> el dibujo. Da igual que
                el archivo traiga mucho espacio en blanco alrededor o el logo descolocado.
              </li>
              <li>
                · <strong className="text-text">Quita colores y rellenos.</strong> El neón se pinta
                del color que elija el cliente, así que el color del archivo no importa.
              </li>
              <li>
                · <strong className="text-text">Propone un grosor de tubo</strong> proporcional al
                tamaño del dibujo.
              </li>
            </ul>

            <p className="mt-5 text-sm font-semibold text-text">Mensajes que te puedes encontrar</p>
            <Table
              head={["Dice…", "Qué hacer"]}
              rows={[
                [
                  "«Eso no parece un SVG»",
                  "Has soltado un JPG, PNG o similar. Solo valen vectoriales.",
                ],
                [
                  "«No se ha encontrado ningún trazo»",
                  "El diseño es solo texto sin trazar. Conviértelo a curvas y vuelve a exportar.",
                ],
                [
                  "«No trae viewBox ni medidas»",
                  "Vuelve a exportarlo indicando el tamaño del documento.",
                ],
                [
                  "«Tiene demasiados puntos»",
                  "Es un trazado autovectorizado muy pesado. Simplifícalo (Objeto → Trazado → Simplificar).",
                ],
              ]}
            />

            <Note kind="warn" title="Los EPS y AI no se pueden dibujar en la web">
              Ningún navegador sabe enseñar un EPS. Si sueltas uno, se guarda como{" "}
              <strong>archivo de taller</strong> (lo tendrás descargable desde la lista de
              productos), pero <strong>necesitas además un SVG</strong> para que el neón se vea en
              la tienda.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="precios"
            title="9. Precios"
            lead="Pantalla Precios. Manda sobre el configurador de neón a medida."
          >
            <p className="text-sm leading-relaxed text-muted">
              El precio de un neón personalizado no está escrito en el código: sale de esta
              fórmula, y todos sus números se tocan desde aquí.
            </p>
            <p className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-text">
              (metros de tubo × €/m + m² de material × €/m² + RGB + soporte) × uso × entrega
            </p>

            <Table
              head={["Bloque", "Qué controla"]}
              rows={[
                [
                  "Tarifas de fabricación",
                  "€ por metro de tubo, € por m² de acrílico, suplemento del RGB, pedido mínimo y vatios por metro.",
                ],
                [
                  "Entrega",
                  "El multiplicador del express. 1,2 significa que la entrega en 24-48 h cuesta un 20 % más.",
                ],
                [
                  "Tamaños",
                  "La geometría con la que se estima cada tamaño: altura de letra, ancho por letra y metros de tubo por letra. Cambiarlo mueve el precio de todos los neones de ese tamaño.",
                ],
                ["Suplemento por soporte", "Lo que se suma por cada tipo de contorno."],
                ["Multiplicador por uso", "El recargo del acabado de exterior (IP65)."],
              ]}
            />

            <Note kind="warn" title="Cada cambio se publica al momento">
              No hay borrador ni confirmación. En cuanto pulsas Guardar, la tienda cobra con los
              números nuevos. Revisa bien antes.
            </Note>

            <Note kind="info" title="El envío no se toca desde aquí (todavía)">
              El coste de envío (9,90 €) y el mínimo para que salga gratis (200 €) están guardados
              pero <strong>no tienen pantalla en el panel</strong>. Para cambiarlos hay que pedirlo
              a quien lleve el desarrollo.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="opiniones"
            title="10. Opiniones de Trustpilot"
            lead="Pantalla Opiniones. La nota que se enseña en la portada y en el pie."
          >
            <Steps
              items={[
                {
                  do: "Abre vuestra ficha real de Trustpilot (hay un enlace en la propia pantalla).",
                },
                { do: "Copia la puntuación y el número de opiniones." },
                { do: "Pégalos en el formulario y guarda." },
              ]}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              La etiqueta («Excelente», «Genial»…) se calcula sola a partir de la puntuación, para
              que no puedan contradecirse. También hay un interruptor para{" "}
              <strong className="text-text">esconder la insignia</strong> sin perder los datos.
            </p>

            <Note kind="stop" title="Esto no se actualiza solo: hay que revisarlo">
              Trustpilot no deja leer la nota automáticamente. Cada vez que entren opiniones
              nuevas, la cifra de la web se queda vieja. Publicar una valoración que no coincide
              con la real va contra las normas de Trustpilot, así que conviene mirarlo de vez en
              cuando. La pantalla te dice cuándo se actualizó por última vez.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="usuarios"
            title="11. Usuarios y seguridad"
            lead="Pantalla Seguridad para todos; Usuarios solo para el superadmin."
          >
            <p className="text-sm font-semibold text-text">Seguridad</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Ves tus sesiones abiertas y puedes cerrarlas. El superadmin ve las de todo el mundo y
              tiene un botón de pánico que cierra todas las sesiones de golpe: úsalo si sospechas
              que alguien ha entrado donde no debe.
            </p>

            <p className="mt-5 text-sm font-semibold text-text">Usuarios (solo superadmin)</p>
            <Table
              head={["Acción", "Para qué"]}
              rows={[
                [
                  "Crear usuario",
                  "Alta de un trabajador. Ponle una contraseña inicial de 10 caracteres o más; él configurará su 2FA al entrar por primera vez.",
                ],
                [
                  "Desactivar / reactivar",
                  "Alguien que se va del equipo. Al desactivarlo pierde el acceso al instante, aunque tuviera la sesión abierta.",
                ],
                ["Resetear contraseña", "Se le ha olvidado. Le das una nueva y sus sesiones se cierran."],
                [
                  "Resetear 2FA",
                  "Ha perdido el móvil. Volverá a configurarlo en su próximo inicio de sesión.",
                ],
              ]}
            />

            <Note kind="warn" title="Reglas que no se pueden saltar">
              Nadie puede desactivarse a sí mismo ni desactivar al superadmin, y el 2FA es
              obligatorio para todo el mundo. No hay forma de entrar solo con contraseña.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="cliente"
            title="12. Lo que ve el cliente"
            lead="Conviene conocerlo para entender de dónde salen los datos de un pedido."
          >
            <Table
              head={["Página", "Qué hace"]}
              rows={[
                [
                  "Portada",
                  "Fotos del taller, el configurador entero y los diseños destacados del catálogo.",
                ],
                [
                  "Catálogo",
                  "Todos los productos visibles, filtrables por categoría.",
                ],
                [
                  "Ficha de producto",
                  "Elige color (o RGB), tamaño, contorno y si lo quiere resistente al agua. El precio se recalcula al momento.",
                ],
                [
                  "Personalizar",
                  "El configurador: escribe su texto y elige tipografía, color, tamaño, soporte, uso y plazo. Ve el neón encenderse y el precio en vivo.",
                ],
                [
                  "Diseño a medida",
                  "Sube su logo y pide presupuesto. Cae en Solicitudes, no en Pedidos.",
                ],
                ["Carrito y checkout", "Datos de contacto, dirección y NIF/CIF si es empresa."],
              ]}
            />

            <Note kind="info" title="El precio siempre se recalcula en el servidor">
              Aunque alguien manipule el navegador para cambiar un precio, al finalizar la compra
              se vuelve a calcular con las tarifas reales. Lo que veis en el pedido es el precio
              bueno.
            </Note>
          </Section>

          {/* ------------------------------------------------------------- */}
          <Section
            id="limites"
            title="13. Lo que todavía NO hace la web"
            lead="Para que nadie se lleve una sorpresa. Está todo pendiente de desarrollo."
          >
            <Table
              head={["No hace", "Qué implica para vosotros"]}
              rows={[
                [
                  "Cobrar",
                  "No hay pasarela de pago. El pedido se registra, pero el cobro lo gestionáis por vuestra cuenta.",
                ],
                [
                  "Mandar emails",
                  "Ni al cliente ni a vosotros. Hay que entrar al panel a mirar si ha entrado algo nuevo.",
                ],
                [
                  "Editar productos a fondo",
                  "Del panel solo se cambia precio y visibilidad. Para cambiar el nombre, la descripción o el diseño hay que borrar y volver a crear.",
                ],
                [
                  "Cambiar el coste de envío",
                  "Está fijado en 9,90 € y gratis desde 200 €.",
                ],
                [
                  "Área de cliente",
                  "El cliente no tiene cuenta ni puede consultar sus pedidos. Solo recibe la página de confirmación.",
                ],
              ]}
            />

            <div className="no-print mt-6 rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-text">¿Dudas o algo que no cuadra?</p>
              <p className="mt-1 text-sm text-muted">
                Anota el número de pedido o el producto y qué esperabas que pasara. Con eso se
                resuelve mucho más rápido.
              </p>
            </div>
          </Section>
        </div>

        <p className="no-print mt-12 text-center text-xs text-muted">
          Manual interno de Neon Led Spain · se actualiza con la web
        </p>
      </main>
    </>
  );
}
