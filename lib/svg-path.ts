/**
 * Conversión de un SVG saneado (ver lib/svg-neon.ts) a una lista plana de
 * comandos absolutos `M / L / C / Z`, ya con las transformaciones aplicadas.
 *
 * Es el puente hacia el EPS de producción: PostScript solo entiende rectas y
 * cúbicas, así que aquí se resuelve todo lo demás —arcos elípticos, curvas
 * cuadráticas, atajos (H/V/S/T) y las primitivas (rect, circle, ellipse,
 * line, polyline, polygon)—. Función pura, sin DOM: corre en el servidor.
 */

export type PathCommand =
  | { t: "M"; x: number; y: number }
  | { t: "L"; x: number; y: number }
  | { t: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { t: "Z" };

/** Matriz afín [a b c d e f] como la de SVG/PostScript. */
type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Constante para aproximar un cuarto de circunferencia con una cúbica. */
const KAPPA = 0.5522847498307936;

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

// --------------------------------------------------------------- Escáner

/**
 * Lector carácter a carácter de los argumentos de un `path`.
 * Hace falta por los **flags** del comando de arco: en un SVG minificado
 * pueden venir pegados (`a1 1 0 011 1`), y un tokenizador de números
 * corriente leería `011` como un solo valor.
 */
class Scanner {
  private i = 0;
  constructor(private readonly s: string) {}

  private skip() {
    while (this.i < this.s.length && /[\s,]/.test(this.s[this.i])) this.i++;
  }

  atEnd(): boolean {
    this.skip();
    return this.i >= this.s.length;
  }

  /** Devuelve la letra de comando si toca una, sin consumirla si no. */
  readCommand(): string | null {
    this.skip();
    const c = this.s[this.i];
    if (c && /[MmLlHhVvCcSsQqTtAaZz]/.test(c)) {
      this.i++;
      return c;
    }
    return null;
  }

  readNumber(): number {
    this.skip();
    const start = this.i;
    if (this.s[this.i] === "+" || this.s[this.i] === "-") this.i++;
    while (this.i < this.s.length && /\d/.test(this.s[this.i])) this.i++;
    if (this.s[this.i] === ".") {
      this.i++;
      while (this.i < this.s.length && /\d/.test(this.s[this.i])) this.i++;
    }
    if (this.s[this.i] === "e" || this.s[this.i] === "E") {
      const save = this.i;
      this.i++;
      if (this.s[this.i] === "+" || this.s[this.i] === "-") this.i++;
      if (/\d/.test(this.s[this.i] ?? "")) {
        while (this.i < this.s.length && /\d/.test(this.s[this.i])) this.i++;
      } else {
        this.i = save;
      }
    }
    const n = parseFloat(this.s.slice(start, this.i));
    return Number.isFinite(n) ? n : NaN;
  }

  /** Un flag de arco es exactamente un carácter: '0' o '1'. */
  readFlag(): number {
    this.skip();
    const c = this.s[this.i];
    if (c === "0" || c === "1") {
      this.i++;
      return c === "1" ? 1 : 0;
    }
    return NaN;
  }
}

// ------------------------------------------------------- Arco → cúbicas

/**
 * Arco elíptico de SVG a una serie de cúbicas.
 * Implementa la conversión de parámetros "endpoint" a "centro" del anexo F.6
 * de la especificación de SVG.
 */
function arcToCurves(
  x0: number,
  y0: number,
  rx: number,
  ry: number,
  rotationDeg: number,
  largeArc: number,
  sweep: number,
  x: number,
  y: number
): PathCommand[] {
  if (x0 === x && y0 === y) return [];
  // Radio nulo: la especificación dice tratarlo como una recta.
  if (rx === 0 || ry === 0) return [{ t: "L", x, y }];

  rx = Math.abs(rx);
  ry = Math.abs(ry);

  const phi = (rotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (x0 - x) / 2;
  const dy2 = (y0 - y) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  // Radios demasiado pequeños para unir los extremos: se agrandan.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, num / den));

  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
    const a = Math.acos(Math.min(1, Math.max(-1, dot / (len || 1))));
    return ux * vy - uy * vx < 0 ? -a : a;
  };

  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry
  );
  if (sweep === 0 && delta > 0) delta -= 2 * Math.PI;
  if (sweep === 1 && delta < 0) delta += 2 * Math.PI;

  // Un cuarto de vuelta por cúbica mantiene el error por debajo de lo visible.
  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
  const step = delta / segments;
  const k = (4 / 3) * Math.tan(step / 4);

  const out: PathCommand[] = [];
  let t = theta1;
  for (let i = 0; i < segments; i++) {
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const t2 = t + step;
    const cosT2 = Math.cos(t2);
    const sinT2 = Math.sin(t2);

    const p = (ct: number, st: number): [number, number] => [
      cx + rx * cosPhi * ct - ry * sinPhi * st,
      cy + rx * sinPhi * ct + ry * cosPhi * st,
    ];
    const d = (ct: number, st: number): [number, number] => [
      -rx * cosPhi * st - ry * sinPhi * ct,
      -rx * sinPhi * st + ry * cosPhi * ct,
    ];

    const [px1, py1] = p(cosT, sinT);
    const [dx1, dy1] = d(cosT, sinT);
    const [px2, py2] = p(cosT2, sinT2);
    const [dx2b, dy2b] = d(cosT2, sinT2);

    out.push({
      t: "C",
      x1: px1 + k * dx1,
      y1: py1 + k * dy1,
      x2: px2 - k * dx2b,
      y2: py2 - k * dy2b,
      x: px2,
      y: py2,
    });
    t = t2;
  }
  return out;
}

// ------------------------------------------------------ Datos de `path`

/** Convierte el atributo `d` en comandos absolutos M/L/C/Z. */
export function parsePathData(d: string): PathCommand[] {
  const out: PathCommand[] = [];
  const sc = new Scanner(d);

  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // Último control de la cúbica/cuadrática previa, para S y T.
  let lastC: [number, number] | null = null;
  let lastQ: [number, number] | null = null;
  let cmd = "";

  const num = () => sc.readNumber();

  while (!sc.atEnd()) {
    const next = sc.readCommand();
    if (next) {
      cmd = next;
    } else if (!cmd) {
      break; // datos corruptos: no hay comando con el que empezar
    } else if (cmd === "M") {
      cmd = "L"; // repetición implícita de M = L
    } else if (cmd === "m") {
      cmd = "l";
    }

    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;

    switch (cmd.toUpperCase()) {
      case "M": {
        x = num() + ox;
        y = num() + oy;
        startX = x;
        startY = y;
        out.push({ t: "M", x, y });
        lastC = lastQ = null;
        break;
      }
      case "L": {
        x = num() + ox;
        y = num() + oy;
        out.push({ t: "L", x, y });
        lastC = lastQ = null;
        break;
      }
      case "H": {
        x = num() + ox;
        out.push({ t: "L", x, y });
        lastC = lastQ = null;
        break;
      }
      case "V": {
        y = num() + oy;
        out.push({ t: "L", x, y });
        lastC = lastQ = null;
        break;
      }
      case "C": {
        const x1 = num() + ox;
        const y1 = num() + oy;
        const x2 = num() + ox;
        const y2 = num() + oy;
        x = num() + ox;
        y = num() + oy;
        out.push({ t: "C", x1, y1, x2, y2, x, y });
        lastC = [x2, y2];
        lastQ = null;
        break;
      }
      case "S": {
        // El primer control es el reflejo del último de la curva anterior.
        const [rx1, ry1] = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const x2 = num() + ox;
        const y2 = num() + oy;
        x = num() + ox;
        y = num() + oy;
        out.push({ t: "C", x1: rx1, y1: ry1, x2, y2, x, y });
        lastC = [x2, y2];
        lastQ = null;
        break;
      }
      case "Q": {
        const qx = num() + ox;
        const qy = num() + oy;
        const px = x;
        const py = y;
        x = num() + ox;
        y = num() + oy;
        out.push(quadToCubic(px, py, qx, qy, x, y));
        lastQ = [qx, qy];
        lastC = null;
        break;
      }
      case "T": {
        // Anotado a mano: `lastQ` se reasigna más abajo a partir de estos
        // valores y TypeScript no puede cerrar la inferencia circular.
        const qx: number = lastQ ? 2 * x - lastQ[0] : x;
        const qy: number = lastQ ? 2 * y - lastQ[1] : y;
        const px = x;
        const py = y;
        x = num() + ox;
        y = num() + oy;
        out.push(quadToCubic(px, py, qx, qy, x, y));
        lastQ = [qx, qy];
        lastC = null;
        break;
      }
      case "A": {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = sc.readFlag();
        const sweep = sc.readFlag();
        const ex = num() + ox;
        const ey = num() + oy;
        if ([rx, ry, rot, large, sweep, ex, ey].some((v) => !Number.isFinite(v))) return out;
        out.push(...arcToCurves(x, y, rx, ry, rot, large, sweep, ex, ey));
        x = ex;
        y = ey;
        lastC = lastQ = null;
        break;
      }
      case "Z": {
        out.push({ t: "Z" });
        x = startX;
        y = startY;
        lastC = lastQ = null;
        break;
      }
      default:
        return out;
    }

    if (!Number.isFinite(x) || !Number.isFinite(y)) return out;
  }

  return out;
}

function quadToCubic(
  px: number,
  py: number,
  qx: number,
  qy: number,
  x: number,
  y: number
): PathCommand {
  return {
    t: "C",
    x1: px + (2 / 3) * (qx - px),
    y1: py + (2 / 3) * (qy - py),
    x2: x + (2 / 3) * (qx - x),
    y2: y + (2 / 3) * (qy - y),
    x,
    y,
  };
}

// ------------------------------------------------------------ Transform

/** Interpreta un atributo `transform` y lo compone en una sola matriz. */
export function parseTransform(value: string): Matrix {
  let m = IDENTITY;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;

  for (const found of value.matchAll(re)) {
    const args = found[2]
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n));

    switch (found[1]) {
      case "matrix":
        if (args.length === 6) m = multiply(m, args as unknown as Matrix);
        break;
      case "translate":
        m = multiply(m, [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0]);
        break;
      case "scale":
        m = multiply(m, [args[0] ?? 1, 0, 0, args[1] ?? args[0] ?? 1, 0, 0]);
        break;
      case "rotate": {
        const a = ((args[0] ?? 0) * Math.PI) / 180;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        // rotate(a cx cy) gira alrededor de un punto.
        if (args.length >= 3) {
          m = multiply(m, [1, 0, 0, 1, args[1], args[2]]);
          m = multiply(m, [cos, sin, -sin, cos, 0, 0]);
          m = multiply(m, [1, 0, 0, 1, -args[1], -args[2]]);
        } else {
          m = multiply(m, [cos, sin, -sin, cos, 0, 0]);
        }
        break;
      }
      case "skewX":
        m = multiply(m, [1, 0, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 1, 0, 0]);
        break;
      case "skewY":
        m = multiply(m, [1, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]);
        break;
    }
  }
  return m;
}

// ------------------------------------------------- Primitivas → comandos

function ellipseCommands(cx: number, cy: number, rx: number, ry: number): PathCommand[] {
  const ox = rx * KAPPA;
  const oy = ry * KAPPA;
  return [
    { t: "M", x: cx - rx, y: cy },
    { t: "C", x1: cx - rx, y1: cy - oy, x2: cx - ox, y2: cy - ry, x: cx, y: cy - ry },
    { t: "C", x1: cx + ox, y1: cy - ry, x2: cx + rx, y2: cy - oy, x: cx + rx, y: cy },
    { t: "C", x1: cx + rx, y1: cy + oy, x2: cx + ox, y2: cy + ry, x: cx, y: cy + ry },
    { t: "C", x1: cx - ox, y1: cy + ry, x2: cx - rx, y2: cy + oy, x: cx - rx, y: cy },
    { t: "Z" },
  ];
}

function rectCommands(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number
): PathCommand[] {
  if (!(w > 0) || !(h > 0)) return [];
  rx = Math.min(rx || ry || 0, w / 2);
  ry = Math.min(ry || rx || 0, h / 2);
  if (rx <= 0 || ry <= 0) {
    return [
      { t: "M", x, y },
      { t: "L", x: x + w, y },
      { t: "L", x: x + w, y: y + h },
      { t: "L", x, y: y + h },
      { t: "Z" },
    ];
  }
  const ox = rx * KAPPA;
  const oy = ry * KAPPA;
  return [
    { t: "M", x: x + rx, y },
    { t: "L", x: x + w - rx, y },
    { t: "C", x1: x + w - rx + ox, y1: y, x2: x + w, y2: y + ry - oy, x: x + w, y: y + ry },
    { t: "L", x: x + w, y: y + h - ry },
    { t: "C", x1: x + w, y1: y + h - ry + oy, x2: x + w - rx + ox, y2: y + h, x: x + w - rx, y: y + h },
    { t: "L", x: x + rx, y: y + h },
    { t: "C", x1: x + rx - ox, y1: y + h, x2: x, y2: y + h - ry + oy, x, y: y + h - ry },
    { t: "L", x, y: y + ry },
    { t: "C", x1: x, y1: y + ry - oy, x2: x + rx - ox, y2: y, x: x + rx, y },
    { t: "Z" },
  ];
}

function pointsCommands(points: string, close: boolean): PathCommand[] {
  const nums = points
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const out: PathCommand[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    out.push({ t: i === 0 ? "M" : "L", x: nums[i], y: nums[i + 1] });
  }
  if (close && out.length) out.push({ t: "Z" });
  return out;
}

// ------------------------------------------------------- Recorrido SVG

const TAG_RE = /<\/?([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
const ATTR_RE = /([a-zA-Z_:][\w:.-]*)\s*=\s*"([^"]*)"/g;

function attrsOf(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of raw.matchAll(ATTR_RE)) out[m[1].toLowerCase()] = m[2];
  return out;
}

function transformCommands(cmds: PathCommand[], m: Matrix): PathCommand[] {
  if (m === IDENTITY) return cmds;
  return cmds.map((c) => {
    if (c.t === "Z") return c;
    if (c.t === "C") {
      const [x1, y1] = apply(m, c.x1, c.y1);
      const [x2, y2] = apply(m, c.x2, c.y2);
      const [x, y] = apply(m, c.x, c.y);
      return { t: "C", x1, y1, x2, y2, x, y };
    }
    const [x, y] = apply(m, c.x, c.y);
    return { t: c.t, x, y };
  });
}

/**
 * Extrae todos los trazos de un SVG saneado, con las transformaciones ya
 * aplicadas y en el sistema de coordenadas del viewBox.
 */
export function svgToCommands(markup: string): PathCommand[] {
  const out: PathCommand[] = [];
  const stack: Matrix[] = [IDENTITY];
  const num = (v: string | undefined, def = 0) => {
    const n = parseFloat(v ?? "");
    return Number.isFinite(n) ? n : def;
  };

  for (const m of markup.matchAll(TAG_RE)) {
    const tag = m[1].toLowerCase();
    const closing = m[0].startsWith("</");
    const selfClosing = /\/>$/.test(m[0]);

    if (tag === "g") {
      if (closing) {
        if (stack.length > 1) stack.pop();
      } else if (!selfClosing) {
        const a = attrsOf(m[2]);
        const current = stack[stack.length - 1];
        stack.push(a.transform ? multiply(current, parseTransform(a.transform)) : current);
      }
      continue;
    }
    if (closing || tag === "svg") continue;

    const a = attrsOf(m[2]);
    let cmds: PathCommand[] = [];

    switch (tag) {
      case "path":
        cmds = a.d ? parsePathData(a.d) : [];
        break;
      case "circle":
        cmds = ellipseCommands(num(a.cx), num(a.cy), num(a.r), num(a.r));
        break;
      case "ellipse":
        cmds = ellipseCommands(num(a.cx), num(a.cy), num(a.rx), num(a.ry));
        break;
      case "rect":
        cmds = rectCommands(num(a.x), num(a.y), num(a.width), num(a.height), num(a.rx), num(a.ry));
        break;
      case "line":
        cmds = [
          { t: "M", x: num(a.x1), y: num(a.y1) },
          { t: "L", x: num(a.x2), y: num(a.y2) },
        ];
        break;
      case "polyline":
        cmds = pointsCommands(a.points ?? "", false);
        break;
      case "polygon":
        cmds = pointsCommands(a.points ?? "", true);
        break;
      default:
        continue;
    }

    if (!cmds.length) continue;
    let local = stack[stack.length - 1];
    if (a.transform) local = multiply(local, parseTransform(a.transform));
    out.push(...transformCommands(cmds, local));
  }

  return out;
}

/** Caja envolvente de los comandos (aproximada: usa también los controles). */
export function commandsBounds(cmds: PathCommand[]) {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  const add = (x: number, y: number) => {
    if (x < x1) x1 = x;
    if (y < y1) y1 = y;
    if (x > x2) x2 = x;
    if (y > y2) y2 = y;
  };

  for (const c of cmds) {
    if (c.t === "Z") continue;
    if (c.t === "C") {
      // Los puntos de control acotan la curva: la caja sale algo holgada,
      // nunca corta el diseño. Suficiente para encajar el documento.
      add(c.x1, c.y1);
      add(c.x2, c.y2);
    }
    add(c.x, c.y);
  }

  return Number.isFinite(x1) ? { x1, y1, x2, y2 } : null;
}
