import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function validateProductImage(file: File): string | null {
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    return "Formato no permitido. Usa JPG, PNG, WebP o GIF.";
  }

  if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    return "La imagen no puede superar 5 MB.";
  }

  return null;
}

function createImagePath(file: File): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = ALLOWED_PRODUCT_IMAGE_TYPES.get(file.type) ?? "jpg";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `products/${year}/${month}/${id}.${extension}`;
}

export function getProductImagePublicUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, "").replace(/^product-images\//, "");
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(cleanPath);

  return data.publicUrl;
}

export async function uploadProductImage(file: File): Promise<string> {
  const validationError = validateProductImage(file);
  if (validationError) throw new Error(validationError);

  const path = createImagePath(file);
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  return getProductImagePublicUrl(path);
}
