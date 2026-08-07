"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServer } from "@/lib/supabase/server";

const BUCKET = "disenos";
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function createCustomRequestAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const desiredSize = String(formData.get("desiredSize") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  const file = formData.get("image");

  // Validación básica en servidor (la del cliente es solo cosmética).
  if (!name || !email || !desiredSize) redirect("/diseno-a-medida?error=campos");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/diseno-a-medida?error=email");

  let imageUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.has(file.type)) redirect("/diseno-a-medida?error=formato");
    if (file.size > MAX_BYTES) redirect("/diseno-a-medida?error=peso");

    const supabase = createSupabaseServer();
    const path = `${randomUUID()}.${EXT[file.type]}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    if (error) {
      console.error("Error subiendo imagen a Storage:", error.message);
      redirect("/diseno-a-medida?error=subida");
    }
    imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  await prisma.customRequest.create({
    data: {
      customerName: name,
      customerEmail: email,
      customerPhone: phone || null,
      desiredSize,
      notes,
      imageUrl,
    },
  });

  redirect("/diseno-a-medida?ok=1");
}
