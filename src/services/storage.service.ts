import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const PRODUCT_IMAGE_ORIGINAL_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const PRODUCT_IMAGE_TARGET_SIZE_BYTES = 250 * 1024;
export const PRODUCT_IMAGE_MAX_OPTIMIZED_SIZE_BYTES = 450 * 1024;
export const PRODUCT_IMAGE_MAX_WIDTH = 1200;
export const PRODUCT_IMAGE_MAX_HEIGHT = 1200;
export const PRODUCT_IMAGE_OUTPUT_TYPE = "image/webp";
export const PRODUCT_IMAGE_INITIAL_QUALITY = 0.82;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export interface OptimizedProductImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  originalType: string;
  width: number;
  height: number;
  mimeType: typeof PRODUCT_IMAGE_OUTPUT_TYPE;
}

export interface ProductImageUploadResult extends OptimizedProductImage {
  publicUrl: string;
  path: string;
}

interface UploadProductImageOptions {
  onPhaseChange?: (phase: "optimizing" | "uploading") => void;
}

export function validateProductImage(file: File): string | null {
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    return "Formato no permitido. Usa JPG, PNG o WebP.";
  }

  if (file.size > PRODUCT_IMAGE_ORIGINAL_MAX_SIZE_BYTES) {
    return "La imagen original no puede superar 10 MB.";
  }

  return null;
}

function createImagePath(): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `products/${year}/${month}/${id}.webp`;
}

function replaceExtensionWithWebp(fileName: string): string {
  const baseName = fileName.trim().replace(/\.[^.]+$/, "") || "product-image";
  return `${baseName}.webp`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen. Intenta con otro archivo."));
          return;
        }
        resolve(blob);
      },
      PRODUCT_IMAGE_OUTPUT_TYPE,
      quality,
    );
  });
}

export async function optimizeProductImage(file: File): Promise<OptimizedProductImage> {
  const validationError = validateProductImage(file);
  if (validationError) throw new Error(validationError);

  if (typeof createImageBitmap === "undefined") {
    throw new Error("Tu navegador no soporta optimizacion de imagenes antes de subir.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No se pudo leer la imagen. Revisa que el archivo no este corrupto.");
  }

  const scale = Math.min(
    1,
    PRODUCT_IMAGE_MAX_WIDTH / bitmap.width,
    PRODUCT_IMAGE_MAX_HEIGHT / bitmap.height,
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No se pudo preparar la optimizacion de la imagen.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const qualities = [PRODUCT_IMAGE_INITIAL_QUALITY, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46];
  let bestBlob: Blob | null = null;

  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, quality);
    bestBlob = blob;
    if (blob.size <= PRODUCT_IMAGE_TARGET_SIZE_BYTES) break;
  }

  if (!bestBlob) {
    throw new Error("No se pudo optimizar la imagen. Intenta con otro archivo.");
  }

  if (bestBlob.size > PRODUCT_IMAGE_MAX_OPTIMIZED_SIZE_BYTES) {
    throw new Error(
      "La imagen optimizada sigue superando 450 KB. Usa una imagen con menos detalle o dimensiones menores.",
    );
  }

  const optimizedFile = new File([bestBlob], replaceExtensionWithWebp(file.name), {
    type: PRODUCT_IMAGE_OUTPUT_TYPE,
    lastModified: Date.now(),
  });

  return {
    file: optimizedFile,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    originalType: file.type,
    width,
    height,
    mimeType: PRODUCT_IMAGE_OUTPUT_TYPE,
  };
}

export function getProductImagePublicUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, "").replace(/^product-images\//, "");
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(cleanPath);

  return data.publicUrl;
}

export async function uploadProductImage(
  file: File,
  options: UploadProductImageOptions = {},
): Promise<ProductImageUploadResult> {
  options.onPhaseChange?.("optimizing");
  const optimized = await optimizeProductImage(file);

  options.onPhaseChange?.("uploading");
  const path = createImagePath();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, optimized.file, {
      cacheControl: "31536000",
      contentType: PRODUCT_IMAGE_OUTPUT_TYPE,
      upsert: false,
    });

  if (error) throw error;

  return {
    ...optimized,
    publicUrl: getProductImagePublicUrl(path),
    path,
  };
}
