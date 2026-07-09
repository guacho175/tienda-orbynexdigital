import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductEditorSection } from "./ProductEditorSection";
import { slugifyProductName } from "./product-editor.mappers";
import type { ProductEditorFieldsProps } from "./product-editor.types";

export function ProductSeoSection({ values, errors, update, disabled }: ProductEditorFieldsProps) {
  return (
    <ProductEditorSection
      title="SEO básico"
      description="Define la dirección pública. Los metadatos SEO avanzados aún no forman parte del producto."
    >
      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <div className="flex overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring">
          <span className="flex items-center border-r border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
            /producto/
          </span>
          <Input
            id="slug"
            value={values.slug}
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
    </ProductEditorSection>
  );
}
