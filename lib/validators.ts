/**
 * Validaciones de datos fiscales y de envío (España).
 * Módulo puro: se usa en cliente (feedback inmediato) y en servidor (fuente de verdad).
 */

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/** NIF de persona física: 8 dígitos + letra de control. */
function isValidNif(value: string): boolean {
  if (!/^\d{8}[A-Z]$/.test(value)) return false;
  const number = Number(value.slice(0, 8));
  return DNI_LETTERS[number % 23] === value[8];
}

/** NIE: X/Y/Z + 7 dígitos + letra (la inicial cuenta como 0/1/2). */
function isValidNie(value: string): boolean {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(value)) return false;
  const prefix = { X: "0", Y: "1", Z: "2" }[value[0] as "X" | "Y" | "Z"];
  const number = Number(prefix + value.slice(1, 8));
  return DNI_LETTERS[number % 23] === value[8];
}

/** CIF de empresa: letra + 7 dígitos + dígito/letra de control. */
function isValidCif(value: string): boolean {
  if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(value)) return false;

  const digits = value.slice(1, 8);
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const n = Number(digits[i]);
    // Posiciones impares (índice par) se duplican y se suman sus cifras.
    sum += i % 2 === 0 ? Math.floor((n * 2) / 10) + ((n * 2) % 10) : n;
  }
  const controlDigit = (10 - (sum % 10)) % 10;
  const control = value[8];
  const letterControl = "JABCDEFGHI"[controlDigit];

  // Según la letra inicial el control es número, letra o cualquiera de los dos.
  if ("PQRSNW".includes(value[0])) return control === letterControl;
  if ("ABEH".includes(value[0])) return control === String(controlDigit);
  return control === String(controlDigit) || control === letterControl;
}

/** Normaliza (mayúsculas, sin espacios ni guiones) para validar y guardar. */
export function normalizeTaxId(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

/** NIF o NIE (particulares). */
export function isValidPersonalTaxId(value: string): boolean {
  const v = normalizeTaxId(value);
  return isValidNif(v) || isValidNie(v);
}

/** CIF, NIF o NIE (empresas y autónomos). */
export function isValidCompanyTaxId(value: string): boolean {
  const v = normalizeTaxId(value);
  return isValidCif(v) || isValidNif(v) || isValidNie(v);
}

export function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(value.trim());
}

/** Teléfono español: 9 dígitos empezando por 6, 7, 8 o 9 (admite prefijo +34). */
export function isValidPhone(value: string): boolean {
  const v = value.replace(/[\s.-]/g, "").replace(/^(\+34|0034)/, "");
  return /^[6789]\d{8}$/.test(v);
}

/** Código postal español: 5 dígitos, provincia 01-52. */
export function isValidPostalCode(value: string): boolean {
  const v = value.trim();
  if (!/^\d{5}$/.test(v)) return false;
  const province = Number(v.slice(0, 2));
  return province >= 1 && province <= 52;
}

/** Provincias de España (para el selector del formulario). */
export const PROVINCES = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón",
  "Ceuta", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
  "Guipúzcoa", "Huelva", "Huesca", "Illes Balears", "Jaén", "La Rioja",
  "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Melilla", "Murcia",
  "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel",
  "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza",
] as const;
