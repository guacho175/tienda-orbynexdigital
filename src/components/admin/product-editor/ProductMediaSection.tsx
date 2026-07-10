import { CheckCircle2, ImageUp, TriangleAlert } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductImageUploadResult } from "@/services/storage.service";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ProductMediaSectionProps extends ProductEditorFieldsProps {
  uploadingImage: boolean;
  imageUploadPhase: "optimizing" | "uploading" | null;
  imageUploadError: string | null;
  imageUploadResult: ProductImageUploadResult | null;
  hasLegacyImage: boolean;
  hasOptimizedVariants: boolean;
  updateManualImageUrl: (value: string) => void;
  onImageUpload: (file: File | undefined) => Promise<void>;
}

export function ProductMediaSection({
  values,
  errors,
  disabled,
  uploadingImage,
  imageUploadPhase,
  imageUploadError,
  imageUploadResult,
  hasLegacyImage,
  hasOptimizedVariants,
  updateManualImageUrl,
  onImageUpload,
}: ProductMediaSectionProps) {
  const technicalVariantError =
    errors.image_url_thumb || errors.image_url_card || errors.image_url_detail;

  return (
    <ProductEditorSection
      title="Multimedia"
      description="Gestiona la imagen principal sin perder el fallback manual ni las variantes optimizadas."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image_url">URL de imagen</Label>
            <Input
              id="image_url"
              value={values.image_url}
              placeholder="https://..."
              disabled={disabled || uploadingImage}
              aria-invalid={Boolean(errors.image_url)}
              aria-describedby={errors.image_url ? "image-url-error" : "image-url-help"}
              onChange={(event) => updateManualImageUrl(event.target.value)}
            />
            {errors.image_url ? (
              <p id="image-url-error" className="text-xs text-destructive">
                {errors.image_url}
              </p>
            ) : (
              <p id="image-url-help" className="text-xs leading-relaxed text-muted-foreground">
                Al ingresar una URL manual se conservan la compatibilidad y el fallback para
                productos existentes.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_image_upload">Subir una imagen</Label>
            <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                  <ImageUp className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Optimización automática</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WebP. Original de hasta 10 MB.
                  </p>
                </div>
              </div>
              <Input
                id="product_image_upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={disabled || uploadingImage}
                aria-invalid={Boolean(imageUploadError || errors.image_upload)}
                aria-describedby={
                  imageUploadError || errors.image_upload ? "image-upload-error" : undefined
                }
                onChange={(event) => {
                  void onImageUpload(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            {imageUploadPhase ? (
              <p className="text-xs text-accent" aria-live="polite">
                {imageUploadPhase === "optimizing"
                  ? "Optimizando imagen…"
                  : "Subiendo variantes optimizadas…"}
              </p>
            ) : null}
            {imageUploadError || errors.image_upload ? (
              <p id="image-upload-error" className="text-xs text-destructive">
                {imageUploadError ?? errors.image_upload}
              </p>
            ) : null}
          </div>

          {imageUploadResult ? (
            <div className="rounded-xl border border-white/10 bg-secondary/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
                Imagen optimizada correctamente
              </div>
              <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt>Original</dt>
                  <dd className="text-foreground">
                    {formatFileSize(imageUploadResult.originalSize)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Miniatura</dt>
                  <dd className="text-foreground">{formatFileSize(imageUploadResult.thumbSize)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Tarjeta</dt>
                  <dd className="text-foreground">{formatFileSize(imageUploadResult.cardSize)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Detalle</dt>
                  <dd className="text-foreground">
                    {formatFileSize(imageUploadResult.detailSize)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {hasLegacyImage ? (
            <div className="flex gap-3 rounded-xl border border-amber-300/25 bg-amber-300/8 p-4 text-sm text-amber-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Esta imagen usa el formato anterior. Seguirá funcionando; puedes volver a subirla
                para generar las tres variantes optimizadas.
              </p>
            </div>
          ) : null}

          {technicalVariantError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Una variante guardada no tiene una URL válida. Vuelve a subir la imagen o ingresa una
              URL manual para reemplazar las variantes.
            </p>
          ) : null}
        </div>

        <aside className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Vista previa
          </p>
          <ProductImage
            src={values.image_url}
            thumbSrc={values.image_url_thumb}
            cardSrc={values.image_url_card}
            detailSrc={values.image_url_detail}
            alt={values.name ? `Imagen de ${values.name}` : "Vista previa del producto"}
            variant="card"
            sizes="280px"
            className="aspect-[4/3] rounded-2xl border border-white/10"
            iconClassName="h-10 w-10"
          />
          <div className="flex flex-wrap gap-2">
            {hasOptimizedVariants ? (
              <>
                <Badge variant="outline">Miniatura lista</Badge>
                <Badge variant="outline">Tarjeta lista</Badge>
                <Badge variant="outline">Detalle listo</Badge>
              </>
            ) : values.image_url ? (
              <Badge variant="outline">Imagen principal</Badge>
            ) : (
              <Badge variant="secondary">Sin imagen</Badge>
            )}
          </div>
        </aside>
      </div>
    </ProductEditorSection>
  );
}
