import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { productEditorConfig } from "@/config/product-editor.config";
import { ProductEditorCharacterCounter } from "./ProductEditorCharacterCounter";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

export function ProductOrganizationSection({
  values,
  errors,
  update,
  disabled,
}: ProductEditorFieldsProps) {
  return (
    <ProductEditorSection
      title="Organización y visibilidad"
      description="Ordena el catálogo y controla si el producto está publicado."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="category">Categoría</Label>
              <ProductEditorCharacterCounter
                value={values.category}
                max={productEditorConfig.characterLimits.category}
              />
            </div>
            <Input
              id="category"
              value={values.category}
              maxLength={productEditorConfig.characterLimits.category}
              disabled={disabled}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "category-error" : "category-help"}
              onChange={(event) => update("category", event.target.value)}
            />
            {errors.category ? (
              <p id="category-error" className="text-xs text-destructive">
                {errors.category}
              </p>
            ) : (
              <p id="category-help" className="text-xs text-muted-foreground">
                Usa una categoría coherente con el catálogo actual.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_order">Orden</Label>
            <Input
              id="display_order"
              type="number"
              min={0}
              value={values.display_order}
              disabled={disabled}
              aria-invalid={Boolean(errors.display_order)}
              aria-describedby={errors.display_order ? "display-order-error" : undefined}
              onChange={(event) => update("display_order", Number(event.target.value))}
            />
            {errors.display_order ? (
              <p id="display-order-error" className="text-xs text-destructive">
                {errors.display_order}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-secondary/20 p-4">
          <div className="flex gap-3">
            <span className="mt-0.5 text-accent">
              {values.is_active ? (
                <Eye className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">
                {values.is_active ? "Producto activo" : "Producto inactivo"}
              </Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {values.is_active
                  ? "El producto puede aparecer en la tienda según sus reglas de inventario."
                  : "El producto permanece en administración, pero no se muestra públicamente."}
              </p>
            </div>
          </div>
          <Switch
            id="is_active"
            checked={values.is_active}
            disabled={disabled}
            onCheckedChange={(checked) => update("is_active", checked)}
          />
        </div>
      </div>
    </ProductEditorSection>
  );
}
