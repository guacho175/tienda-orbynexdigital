import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandConfig } from "@/config/brand.config";
import { productEditorConfig } from "@/config/product-editor.config";
import { ProductEditorCharacterCounter } from "./ProductEditorCharacterCounter";
import { ProductEditorSection } from "./ProductEditorSection";
import { slugifyProductName } from "./product-editor.mappers";
import type { ProductEditorFieldsProps } from "./product-editor.types";

export function ProductSeoSection({ values, errors, update, disabled }: ProductEditorFieldsProps) {
  const previewTitle = values.name.trim() || "Nombre del producto";
  const previewDescription =
    values.short_description.trim() ||
    "Agrega una descripción corta para previsualizar el resumen público del producto.";
  const previewSlug = values.slug || slugifyProductName(values.name) || "producto";
  const previewPath = `/producto/${previewSlug}`;

  return (
    <ProductEditorSection
      title="SEO básico"
      description="Define la dirección pública. Los metadatos SEO avanzados aún no forman parte del producto."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="slug">Slug *</Label>
            <ProductEditorCharacterCounter
              value={values.slug}
              max={productEditorConfig.characterLimits.slug}
            />
          </div>
          <div className="flex overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring">
            <span className="flex items-center border-r border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
              /producto/
            </span>
            <Input
              id="slug"
              value={values.slug}
              maxLength={productEditorConfig.characterLimits.slug}
              disabled={disabled}
              className="rounded-none border-0 focus-visible:ring-0"
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "slug-error" : "slug-help"}
              onChange={(event) => update("slug", slugifyProductName(event.target.value))}
            />
          </div>
          {errors.slug ? (
            <p id="slug-error" className="text-xs text-destructive">
              {errors.slug}
            </p>
          ) : (
            <p id="slug-help" className="text-xs leading-relaxed text-muted-foreground">
              Usa una dirección breve, estable y fácil de reconocer. Cambiarla modifica el enlace
              público del producto.
            </p>
          )}
        </div>

        {productEditorConfig.featureFlags.seoPreview ? (
          <div
            aria-label="Vista previa SEO derivada"
            className="rounded-xl border border-cyan-400/20 bg-background/70 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Vista previa derivada</span>
              <span aria-hidden="true">·</span>
              <span>No guarda metadatos SEO nuevos</span>
            </div>
            <p className="mt-3 text-sm text-cyan-300">{brandConfig.name}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{previewPath}</p>
            <p className="mt-3 text-base font-semibold leading-snug text-foreground">
              {previewTitle}
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {previewDescription}
            </p>
          </div>
        ) : null}
      </div>
    </ProductEditorSection>
  );
}
