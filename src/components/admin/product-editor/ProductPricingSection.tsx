import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { commerceConfig } from "@/config/commerce.config";
import { productEditorConfig } from "@/config/product-editor.config";
import { formatCurrency } from "@/utils/currency";
import { ProductEditorCharacterCounter } from "./ProductEditorCharacterCounter";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

export function ProductPricingSection({
  values,
  errors,
  update,
  disabled,
}: ProductEditorFieldsProps) {
  const copy = productEditorConfig.copy.pricing;
  const formattedPrice = formatCurrency(
    Number.isFinite(values.price) ? values.price : 0,
    values.currency,
    commerceConfig.locale,
  );
  const supportedCurrencies = productEditorConfig.currency.options as readonly string[];
  const hasUnsupportedCurrency = !supportedCurrencies.includes(values.currency);

  return (
    <ProductEditorSection title="Precios y pago" description={copy.sectionDescription}>
      <div className="space-y-4">
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
                    {values.currency} - no compatible
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
          <h3 className="text-sm font-semibold text-foreground">{copy.externalPayment.title}</h3>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <Label
              htmlFor="payment_external_enabled"
              className="cursor-pointer text-sm font-medium"
            >
              {copy.externalPayment.toggleLabel}
            </Label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {copy.externalPayment.toggleHelp}
            </p>
          </div>
          <Switch
            id="payment_external_enabled"
            checked={values.payment_external_enabled}
            disabled={disabled}
            onCheckedChange={(checked) => {
              update("payment_external_enabled", checked);
              if (!checked) {
                update("payment_url", "");
                update("payment_button_label", "");
              }
            }}
          />
        </div>

        {values.payment_external_enabled ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">{copy.externalPayment.warningTitle}</p>
              <p className="mt-1 leading-relaxed">{copy.externalPayment.warningDescription}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_url">{copy.externalPayment.urlLabel}</Label>
              <Input
                id="payment_url"
                value={values.payment_url}
                placeholder="https://..."
                disabled={disabled}
                aria-invalid={Boolean(errors.payment_url)}
                aria-describedby={errors.payment_url ? "payment-url-error" : "payment-url-help"}
                onChange={(event) => update("payment_url", event.target.value)}
              />
              {errors.payment_url ? (
                <p id="payment-url-error" className="text-xs text-destructive">
                  {errors.payment_url}
                </p>
              ) : (
                <p id="payment-url-help" className="text-xs leading-relaxed text-muted-foreground">
                  {copy.externalPayment.urlHelp}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="payment_button_label">{copy.externalPayment.buttonLabel}</Label>
                <ProductEditorCharacterCounter
                  value={values.payment_button_label}
                  max={productEditorConfig.characterLimits.payment_button_label}
                />
              </div>
              <Input
                id="payment_button_label"
                value={values.payment_button_label}
                maxLength={productEditorConfig.characterLimits.payment_button_label}
                disabled={disabled}
                aria-invalid={Boolean(errors.payment_button_label)}
                aria-describedby={
                  errors.payment_button_label
                    ? "payment-button-label-error"
                    : "payment-button-label-help"
                }
                onChange={(event) => update("payment_button_label", event.target.value)}
              />
              {errors.payment_button_label ? (
                <p id="payment-button-label-error" className="text-xs text-destructive">
                  {errors.payment_button_label}
                </p>
              ) : (
                <p
                  id="payment-button-label-help"
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {copy.externalPayment.buttonHelp}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ProductEditorSection>
  );
}
