import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const PRODUCT_IMAGE_ORIGINAL_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const PRODUCT_IMAGE_OUTPUT_TYPE = "image/webp";
export const PRODUCT_IMAGE_ABSOLUTE_MAX_SIZE_BYTES = 250 * 1024;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ProductImageVariantName = "thumb" | "card" | "detail";

export interface ProductImageVariantOptions {
  name: ProductImageVariantName;
  maxWidth: number;
  maxHeight: number;
  initialQuality: number;
  minQuality: number;
  targetSizeBytes: number;
  maxSizeBytes: number;
}

export const PRODUCT_IMAGE_VARIANT_OPTIONS: Record<
  ProductImageVariantName,
  ProductImageVariantOptions
> = {
  thumb: {
    name: "thumb",
    maxWidth: 320,
    maxHeight: 320,
    initialQuality: 0.7,
    minQuality: 0.45,
    targetSizeBytes: 35 * 1024,
    maxSizeBytes: 50 * 1024,
  },
  card: {
    name: "card",
    maxWidth: 480,
    maxHeight: 480,
    initialQuality: 0.7,
    minQuality: 0.45,
    targetSizeBytes: 40 * 1024,
    maxSizeBytes: 80 * 1024,
  },
  detail: {
    name: "detail",
    maxWidth: 1000,
    maxHeight: 1000,
    initialQuality: 0.78,
    minQuality: 0.55,
    targetSizeBytes: 140 * 1024,
    maxSizeBytes: 220 * 1024,
  },
};

export interface OptimizedProductImageVariant {
  variant: ProductImageVariantName;
  file: File;
  originalSize: number;
  optimizedSize: number;
  originalType: string;
  width: number;
  height: number;
  mimeType: typeof PRODUCT_IMAGE_OUTPUT_TYPE;
}

export interface ProductImageVariants {
  thumbUrl: string;
  cardUrl: string;
  detailUrl: string;
  originalSize: number;
  thumbSize: number;
  cardSize: number;
  detailSize: number;
  width: number;
  height: number;
}

export interface ProductImageVariantsUploadResult extends ProductImageVariants {
  thumbPath: string;
  cardPath: string;
  detailPath: string;
}

export type ProductImageUploadResult = ProductImageVariantsUploadResult;

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

function createImageBasePath(): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `products/${year}/${month}/${id}`;
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

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

function createQualitySteps(initialQuality: number, minQuality: number): number[] {
  const steps: number[] = [];
  for (let quality = initialQuality; quality >= minQuality; quality -= 0.06) {
    steps.push(Number(quality.toFixed(2)));
  }
  if (!steps.includes(minQuality)) steps.push(minQuality);
  return steps;
}

export async function optimizeImageVariant(
  file: File,
  options: ProductImageVariantOptions,
): Promise<OptimizedProductImageVariant> {
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

  const scale = Math.min(1, options.maxWidth / bitmap.width, options.maxHeight / bitmap.height);
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

  let bestBlob: Blob | null = null;

  for (const quality of createQualitySteps(options.initialQuality, options.minQuality)) {
    const blob = await canvasToBlob(canvas, quality);
    bestBlob = blob;
    if (blob.size <= options.targetSizeBytes) break;
  }

  if (!bestBlob) {
    throw new Error("No se pudo optimizar la imagen. Intenta con otro archivo.");
  }

  if (
    bestBlob.size > options.maxSizeBytes ||
    bestBlob.size > PRODUCT_IMAGE_ABSOLUTE_MAX_SIZE_BYTES
  ) {
    throw new Error(
      `La variante ${options.name} queda en ${formatKb(bestBlob.size)} y supera el maximo de ${formatKb(options.maxSizeBytes)}. Usa una imagen mas simple o recortada.`,
    );
  }

  const optimizedFile = new File([bestBlob], `product-${options.name}.webp`, {
    type: PRODUCT_IMAGE_OUTPUT_TYPE,
    lastModified: Date.now(),
  });

  return {
    variant: options.name,
    file: optimizedFile,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    originalType: file.type,
    width,
    height,
    mimeType: PRODUCT_IMAGE_OUTPUT_TYPE,
  };
}

export async function optimizeProductImageVariants(
  file: File,
): Promise<Record<ProductImageVariantName, OptimizedProductImageVariant>> {
  const [thumb, card, detail] = await Promise.all([
    optimizeImageVariant(file, PRODUCT_IMAGE_VARIANT_OPTIONS.thumb),
    optimizeImageVariant(file, PRODUCT_IMAGE_VARIANT_OPTIONS.card),
    optimizeImageVariant(file, PRODUCT_IMAGE_VARIANT_OPTIONS.detail),
  ]);

  return { thumb, card, detail };
}

export function getProductImagePublicUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, "").replace(/^product-images\//, "");
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(cleanPath);

  return data.publicUrl;
}

async function uploadOptimizedVariant(
  basePath: string,
  optimized: OptimizedProductImageVariant,
): Promise<{ path: string; publicUrl: string }> {
  const path = `${basePath}-${optimized.variant}.webp`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, optimized.file, {
      cacheControl: "31536000",
      contentType: PRODUCT_IMAGE_OUTPUT_TYPE,
      upsert: false,
    });

  if (error) throw error;

  return {
    path,
    publicUrl: getProductImagePublicUrl(path),
  };
}

export async function uploadProductImageVariants(
  file: File,
  options: UploadProductImageOptions = {},
): Promise<ProductImageVariantsUploadResult> {
  options.onPhaseChange?.("optimizing");
  const variants = await optimizeProductImageVariants(file);

  options.onPhaseChange?.("uploading");
  const basePath = createImageBasePath();
  const [thumbUpload, cardUpload, detailUpload] = await Promise.all([
    uploadOptimizedVariant(basePath, variants.thumb),
    uploadOptimizedVariant(basePath, variants.card),
    uploadOptimizedVariant(basePath, variants.detail),
  ]);

  return {
    thumbUrl: thumbUpload.publicUrl,
    cardUrl: cardUpload.publicUrl,
    detailUrl: detailUpload.publicUrl,
    thumbPath: thumbUpload.path,
    cardPath: cardUpload.path,
    detailPath: detailUpload.path,
    originalSize: file.size,
    thumbSize: variants.thumb.optimizedSize,
    cardSize: variants.card.optimizedSize,
    detailSize: variants.detail.optimizedSize,
    width: variants.detail.width,
    height: variants.detail.height,
  };
}

export async function uploadProductImage(
  file: File,
  options: UploadProductImageOptions = {},
): Promise<ProductImageUploadResult> {
  return uploadProductImageVariants(file, options);
}
