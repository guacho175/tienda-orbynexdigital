import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_EDITOR_LIMITS } from "@/config/product-editor.config";
import { ProductEditorCharacterCounter } from "./ProductEditorCharacterCounter";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

interface ProductGeneralSectionProps extends ProductEditorFieldsProps {
  updateName: (value: string) => void;
}

export function ProductGeneralSection({
  values,
  errors,
  update,
  updateName,
  disabled,
}: ProductGeneralSectionProps) {
  return (
    <ProductEditorSection
      title="Información general"
      description="Define el nombre y la información comercial que verá el cliente."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="name">Nombre *</Label>
            <ProductEditorCharacterCounter value={values.name} max={PRODUCT_EDITOR_LIMITS.name} />
          </div>
          <Input
            id="name"
            value={values.name}
            maxLength={PRODUCT_EDITOR_LIMITS.name}
            disabled={disabled}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            onChange={(event) => updateName(event.target.value)}
          />
          {errors.name ? (
            <p id="name-error" className="text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="short_description">Descripción corta</Label>
            <ProductEditorCharacterCounter
              value={values.short_description}
              max={PRODUCT_EDITOR_LIMITS.short_description}
            />
          </div>
          <Input
            id="short_description"
            value={values.short_description}
            maxLength={PRODUCT_EDITOR_LIMITS.short_description}
            disabled={disabled}
            aria-invalid={Boolean(errors.short_description)}
            aria-describedby={errors.short_description ? "short-description-error" : undefined}
            onChange={(event) => update("short_description", event.target.value)}
          />
          {errors.short_description ? (
            <p id="short-description-error" className="text-xs text-destructive">
              {errors.short_description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="description">Descripción completa</Label>
            <ProductEditorCharacterCounter
              value={values.description}
              max={PRODUCT_EDITOR_LIMITS.description}
            />
          </div>
          <Textarea
            id="description"
            rows={6}
            value={values.description}
            maxLength={PRODUCT_EDITOR_LIMITS.description}
            disabled={disabled}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
            onChange={(event) => update("description", event.target.value)}
          />
          {errors.description ? (
            <p id="description-error" className="text-xs text-destructive">
              {errors.description}
            </p>
          ) : null}
        </div>
      </div>
    </ProductEditorSection>
  );
}
