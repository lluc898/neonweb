import "server-only";

import { prisma } from "@/lib/prisma";
import { nextOrderNumber, priceCart, type IncomingItem } from "@/lib/order-pricing";
import {
  isValidCompanyTaxId,
  isValidEmail,
  isValidPersonalTaxId,
  isValidPhone,
  isValidPostalCode,
  normalizeTaxId,
} from "@/lib/validators";

/**
 * Lógica del checkout: valida el formulario, **recalcula los precios en
 * servidor** (los importes que llegan del navegador se ignoran) y registra el
 * pedido. Sin dependencias de Next para poder probarla de forma aislada;
 * la server action solo la envuelve y redirige.
 */

export type SubmitResult =
  | { ok: true; number: string }
  | { ok: false; errors: Record<string, string>; message?: string };

const req = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function submitOrder(formData: FormData): Promise<SubmitResult> {
  const errors: Record<string, string> = {};

  // --- Cliente ---
  const isCompany = req(formData.get("customerType")) === "COMPANY";
  const firstName = req(formData.get("firstName"));
  const lastName = req(formData.get("lastName"));
  const companyName = req(formData.get("companyName"));
  const taxIdRaw = req(formData.get("taxId"));
  const email = req(formData.get("email"));
  const phone = req(formData.get("phone"));

  if (firstName.length < 2) errors.firstName = "Indica tu nombre.";
  if (lastName.length < 2) errors.lastName = "Indica tus apellidos.";
  if (!isValidEmail(email)) errors.email = "Email no válido.";
  if (!isValidPhone(phone)) errors.phone = "Teléfono no válido (9 dígitos).";

  if (isCompany) {
    if (companyName.length < 2) errors.companyName = "Indica la razón social.";
    if (!isValidCompanyTaxId(taxIdRaw)) errors.taxId = "CIF/NIF no válido.";
  } else if (taxIdRaw && !isValidPersonalTaxId(taxIdRaw)) {
    // Para particulares el NIF es opcional, pero si lo ponen debe ser correcto.
    errors.taxId = "NIF/NIE no válido.";
  }

  // --- Dirección de envío ---
  const street = req(formData.get("street"));
  const extra = req(formData.get("extra"));
  const postalCode = req(formData.get("postalCode"));
  const city = req(formData.get("city"));
  const province = req(formData.get("province"));

  if (street.length < 4) errors.street = "Indica la dirección.";
  if (!isValidPostalCode(postalCode)) errors.postalCode = "Código postal no válido.";
  if (city.length < 2) errors.city = "Indica la localidad.";
  if (!province) errors.province = "Selecciona la provincia.";

  // --- Facturación (opcional) ---
  const differentBilling = req(formData.get("differentBilling")) === "on";
  const billing = {
    street: req(formData.get("billingStreet")),
    extra: req(formData.get("billingExtra")),
    postalCode: req(formData.get("billingPostalCode")),
    city: req(formData.get("billingCity")),
    province: req(formData.get("billingProvince")),
    country: "España",
  };
  if (differentBilling) {
    if (billing.street.length < 4) errors.billingStreet = "Indica la dirección de facturación.";
    if (!isValidPostalCode(billing.postalCode)) errors.billingPostalCode = "Código postal no válido.";
    if (billing.city.length < 2) errors.billingCity = "Indica la localidad.";
    if (!billing.province) errors.billingProvince = "Selecciona la provincia.";
  }

  if (req(formData.get("terms")) !== "on") {
    errors.terms = "Debes aceptar las condiciones para continuar.";
  }

  // --- Carrito: solo la configuración; los precios se calculan aquí ---
  let incoming: IncomingItem[] = [];
  try {
    const parsed = JSON.parse(req(formData.get("cart")) || "[]");
    if (Array.isArray(parsed)) incoming = parsed as IncomingItem[];
  } catch {
    /* carrito ilegible → se trata como vacío */
  }

  if (!incoming.length) {
    return { ok: false, errors, message: "Tu carrito está vacío." };
  }
  if (Object.keys(errors).length) {
    return { ok: false, errors, message: "Revisa los campos marcados." };
  }

  const priced = await priceCart(incoming);
  if (!priced.items.length) {
    return { ok: false, errors, message: "No hemos podido procesar los artículos del carrito." };
  }

  const data = {
    customerType: isCompany ? ("COMPANY" as const) : ("PARTICULAR" as const),
    firstName,
    lastName,
    companyName: isCompany ? companyName : null,
    taxId: taxIdRaw ? normalizeTaxId(taxIdRaw) : null,
    customerEmail: email,
    customerPhone: phone,
    shippingAddress: { street, extra, postalCode, city, province, country: "España" },
    // undefined (no null): así Prisma lo deja NULL en un campo Json opcional.
    billingAddress: differentBilling ? billing : undefined,
    notes: req(formData.get("notes")).slice(0, 1000),
    subtotalCents: priced.subtotalCents,
    shippingCents: priced.shippingCents,
    totalCents: priced.totalCents,
    items: {
      create: priced.items.map((i) => ({
        kind: i.kind,
        name: i.name,
        priceCents: i.priceCents,
        productId: i.productId ?? null,
        customization: i.customization ?? undefined,
        breakdown: i.breakdown ?? undefined,
      })),
    },
  };

  // Reintenta si dos pedidos simultáneos calculan la misma referencia.
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = await nextOrderNumber();
    try {
      await prisma.order.create({ data: { ...data, number } });
      return { ok: true, number };
    } catch (error) {
      const isDuplicate =
        typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
      if (!isDuplicate) {
        console.error("Error creando el pedido:", error);
        break;
      }
    }
  }

  return {
    ok: false,
    errors,
    message: "No hemos podido registrar el pedido. Inténtalo de nuevo.",
  };
}
