import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { brandConfig } from "@/config/brand.config";
import { productEditorConfig } from "@/config/product-editor.config";
import { buildProductSeoMetadata } from "@/utils/product-seo";
import { ProductEditorCharacterCounter } from "./ProductEditorCharacterCounter";
import { ProductEditorSection } from "./ProductEditorSection";
import { slugifyProductName } from "./product-editor.mappers";
import type { ProductEditorFieldsProps } from "./product-editor.types";

export function ProductSeoSection({ values, errors, update, disabled }: ProductEditorFieldsProps) {
  const preview = buildProductSeoMetadata({
    ...values,
    slug: values.slug || slugifyProductName(values.name),
  });

  return (
    <ProductEditorSection
      title="SEO"
      description="Define la direccion publica y los metadatos que usara la ficha del producto."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="slug">Slug *</Label>
            <ProductEditorCharacterCounter
              value={values.slug}
              max={productEditorConfig.characterLimits.slug}
            />
          </div>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white ring-offset-background focus-within:ring-2 focus-within:ring-cyan-500">
            <span className="flex items-center border-r border-slate-200 bg-white px-3 text-sm text-slate-600">
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
              Usa una direccion breve, estable y facil de reconocer. Cambiarla modifica el enlace
              publico del producto.
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="meta_title">Titulo SEO</Label>
              <ProductEditorCharacterCounter
                value={values.meta_title}
                max={productEditorConfig.characterLimits.meta_title}
              />
            </div>
            <Input
              id="meta_title"
              value={values.meta_title}
              maxLength={productEditorConfig.characterLimits.meta_title}
              disabled={disabled}
              placeholder={values.name || "Nombre del producto"}
              aria-invalid={Boolean(errors.meta_title)}
              aria-describedby={errors.meta_title ? "meta-title-error" : "meta-title-help"}
              onChange={(event) => update("meta_title", event.target.value)}
            />
            {errors.meta_title ? (
              <p id="meta-title-error" className="text-xs text-destructive">
                {errors.meta_title}
              </p>
            ) : (
              <p id="meta-title-help" className="text-xs leading-relaxed text-muted-foreground">
                Si queda vacio, la ficha publica usara el nombre del producto.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="og_image_url">Imagen OpenGraph opcional</Label>
            <Input
              id="og_image_url"
              value={values.og_image_url}
              maxLength={productEditorConfig.characterLimits.og_image_url}
              disabled={disabled}
              placeholder="https://..."
              aria-invalid={Boolean(errors.og_image_url)}
              aria-describedby={errors.og_image_url ? "og-image-url-error" : "og-image-url-help"}
              onChange={(event) => update("og_image_url", event.target.value)}
            />
            {errors.og_image_url ? (
              <p id="og-image-url-error" className="text-xs text-destructive">
                {errors.og_image_url}
              </p>
            ) : (
              <p id="og-image-url-help" className="text-xs leading-relaxed text-muted-foreground">
                Si queda vacia, se usara la imagen de detalle, tarjeta o fallback global.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="meta_description">Descripcion SEO</Label>
            <ProductEditorCharacterCounter
              value={values.meta_description}
              max={productEditorConfig.characterLimits.meta_description}
            />
          </div>
          <Input
            id="meta_description"
            value={values.meta_description}
            maxLength={productEditorConfig.characterLimits.meta_description}
            disabled={disabled}
            placeholder={values.short_description || "Resumen publico del producto"}
            aria-invalid={Boolean(errors.meta_description)}
            aria-describedby={
              errors.meta_description ? "meta-description-error" : "meta-description-help"
            }
            onChange={(event) => update("meta_description", event.target.value)}
          />
          {errors.meta_description ? (
            <p id="meta-description-error" className="text-xs text-destructive">
              {errors.meta_description}
            </p>
          ) : (
            <p id="meta-description-help" className="text-xs leading-relaxed text-muted-foreground">
              Si queda vacia, se usara la descripcion corta o la descripcion completa.
            </p>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <Label htmlFor="seo_noindex">No indexar este producto</Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Publica robots noindex,nofollow en la ficha publica sin cambiar su visibilidad en la
              tienda.
            </p>
          </div>
          <Switch
            id="seo_noindex"
            checked={values.seo_noindex}
            disabled={disabled}
            aria-label="No indexar este producto"
            onCheckedChange={(checked) => update("seo_noindex", checked)}
          />
        </div>

        {productEditorConfig.featureFlags.seoPreview ? (
          <div
            aria-label="Vista previa SEO"
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>Vista previa real</span>
              <span aria-hidden="true">Â·</span>
              <span>Usa la misma cascada que {preview.path}</span>
              {preview.robots ? (
                <>
                  <span aria-hidden="true">Â·</span>
                  <span>{preview.robots}</span>
                </>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-medium text-cyan-700">{brandConfig.name}</p>
            <p className="mt-1 break-all text-xs text-slate-600">{preview.path}</p>
            <p className="mt-3 text-base font-semibold leading-snug text-slate-950">
              {preview.title}
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-700">
              {preview.description}
            </p>
          </div>
        ) : null}
      </div>
    </ProductEditorSection>
  );
}
