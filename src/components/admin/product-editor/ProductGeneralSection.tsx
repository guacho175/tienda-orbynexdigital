import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={values.name}
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
          <Label htmlFor="short_description">Descripción corta</Label>
          <Input
            id="short_description"
            value={values.short_description}
            maxLength={200}
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
          <Label htmlFor="description">Descripción completa</Label>
          <Textarea
            id="description"
            rows={8}
            value={values.description}
            maxLength={4000}
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
