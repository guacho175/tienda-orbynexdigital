import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { commerceConfig } from "@/config/commerce.config";
import { productEditorConfig } from "@/config/product-editor.config";
import { formatCurrency } from "@/utils/currency";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

export function ProductPricingSection({
  values,
  errors,
  update,
  disabled,
}: ProductEditorFieldsProps) {
  const formattedPrice = formatCurrency(
    Number.isFinite(values.price) ? values.price : 0,
    values.currency,
    commerceConfig.locale,
  );
  const supportedCurrencies = productEditorConfig.currency.options as readonly string[];
  const hasUnsupportedCurrency = !supportedCurrencies.includes(values.currency);

  return (
    <ProductEditorSection
      title="Precios y pago"
      description="Configura el valor publicado y conserva el enlace de pago alternativo."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-2">
            <Label htmlFor="price">Precio *</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="1"
              value={values.price}
              disabled={disabled}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "price-error" : "price-preview"}
              onChange={(event) => update("price", Number(event.target.value))}
            />
            {errors.price ? (
              <p id="price-error" className="text-xs text-destructive">
                {errors.price}
              </p>
            ) : (
              <p id="price-preview" className="text-xs text-muted-foreground">
                Vista previa: <span className="font-medium text-foreground">{formattedPrice}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={values.currency}
              disabled={disabled}
              onValueChange={(value) => update("currency", value)}
            >
              <SelectTrigger
                id="currency"
                className="h-11"
                aria-invalid={Boolean(errors.currency)}
                aria-describedby={errors.currency ? "currency-error" : "currency-help"}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hasUnsupportedCurrency ? (
                  <SelectItem value={values.currency} disabled>
                    {values.currency} · no compatible
                  </SelectItem>
                ) : null}
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency ? (
              <p id="currency-error" className="text-xs text-destructive">
                {errors.currency}
              </p>
            ) : (
              <p id="currency-help" className="text-xs leading-relaxed text-muted-foreground">
                {hasUnsupportedCurrency
                  ? `La moneda ${values.currency} no es compatible con el pago online activo. Selecciona ${supportedCurrencies.join(", ")} antes de publicar cambios.`
                  : productEditorConfig.currency.lockedHelp}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-white/8 pt-5">
          <h3 className="text-sm font-semibold text-foreground">Pago alternativo</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Mantén esta opción disponible para productos que usan un enlace externo.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_url">URL de pago externo</Label>
          <Input
            id="payment_url"
            value={values.payment_url}
            placeholder="https://..."
            disabled={disabled}
            aria-invalid={Boolean(errors.payment_url)}
            aria-describedby={errors.payment_url ? "payment-url-error" : undefined}
            onChange={(event) => update("payment_url", event.target.value)}
          />
          {errors.payment_url ? (
            <p id="payment-url-error" className="text-xs text-destructive">
              {errors.payment_url}
            </p>
          ) : null}
        </div>

        {values.payment_url || errors.payment_button_label ? (
          <div className="space-y-2">
            <Label htmlFor="payment_button_label">Texto del botón de pago</Label>
            <Input
              id="payment_button_label"
              value={values.payment_button_label}
              maxLength={60}
              disabled={disabled}
              aria-invalid={Boolean(errors.payment_button_label)}
              aria-describedby={
                errors.payment_button_label ? "payment-button-label-error" : undefined
              }
              onChange={(event) => update("payment_button_label", event.target.value)}
            />
            {errors.payment_button_label ? (
              <p id="payment-button-label-error" className="text-xs text-destructive">
                {errors.payment_button_label}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </ProductEditorSection>
  );
}
