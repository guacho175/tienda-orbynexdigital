import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  PRODUCT_AVAILABILITY_OPTIONS,
  PRODUCT_OUT_OF_STOCK_OPTIONS,
  productEditorConfig,
} from "@/config/product-editor.config";
import type { Product } from "@/types/product";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

interface ProductInventorySectionProps extends ProductEditorFieldsProps {
  existingProduct?: Product | null;
  onOpenStockMovements: () => void;
}

function getInventoryStatus(values: ProductEditorFieldsProps["values"]) {
  const statusCopy = productEditorConfig.copy.inventory.status;

  if (values.availability === "out_of_stock") {
    return {
      ...statusCopy.manuallySoldOut,
      className: "border-destructive/40 text-destructive",
    };
  }
  if (!values.track_inventory) {
    return { ...statusCopy.untracked, className: "border-accent/30 text-accent" };
  }
  if (values.stock_quantity <= 0 && values.allow_backorder) {
    return { ...statusCopy.backorder, className: "border-amber-300/40 text-amber-700" };
  }
  if (values.stock_quantity <= 0) {
    return {
      ...(values.out_of_stock_behavior === "hide_product"
        ? statusCopy.soldOutHidden
        : statusCopy.soldOutVisible),
      className: "border-destructive/40 text-destructive",
    };
  }
  if (!values.allow_backorder && values.stock_quantity <= values.low_stock_threshold) {
    return { ...statusCopy.lowStock, className: "border-amber-300/40 text-amber-700" };
  }
  return { ...statusCopy.available, className: "border-accent/30 text-accent" };
}

export function ProductInventorySection({
  values,
  errors,
  update,
  disabled,
  existingProduct,
  onOpenStockMovements,
}: ProductInventorySectionProps) {
  const copy = productEditorConfig.copy.inventory;
  const isExistingProduct = Boolean(existingProduct);
  const registeredStock = existingProduct?.stock_quantity ?? values.stock_quantity;
  const status = getInventoryStatus({ ...values, stock_quantity: registeredStock });

  return (
    <ProductEditorSection title="Inventario" description={copy.sectionDescription}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{copy.resultTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.resultHelp}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{status.description}</p>
          </div>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">{copy.availabilityLabel}</Label>
          <Select
            value={values.availability}
            disabled={disabled}
            onValueChange={(value) =>
              update("availability", value as ProductEditorFieldsProps["values"]["availability"])
            }
          >
            <SelectTrigger id="availability" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_AVAILABILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.availabilityHelp}</p>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <Label htmlFor="track_inventory" className="cursor-pointer text-sm font-medium">
              {copy.trackInventoryLabel}
            </Label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {copy.trackInventoryHelp}
            </p>
          </div>
          <Switch
            id="track_inventory"
            checked={values.track_inventory}
            disabled={disabled}
            onCheckedChange={(checked) => update("track_inventory", checked)}
          />
        </div>

        {isExistingProduct ? (
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">{copy.registeredStockLabel}</Label>
            <Input id="stock_quantity" type="number" min={0} value={registeredStock} disabled />
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {copy.registeredStockHelp}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onOpenStockMovements}>
                {copy.stockMovementsButton}
              </Button>
            </div>
          </div>
        ) : null}

        {values.track_inventory ? (
          <div className="space-y-4">
            <div className={isExistingProduct ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
              {!isExistingProduct ? (
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">{copy.initialStockLabel}</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min={0}
                    value={registeredStock}
                    disabled={disabled}
                    aria-invalid={Boolean(errors.stock_quantity)}
                    aria-describedby={errors.stock_quantity ? "stock-quantity-error" : undefined}
                    onChange={(event) => update("stock_quantity", Number(event.target.value))}
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {copy.initialStockHelp}
                  </p>
                  {errors.stock_quantity ? (
                    <p id="stock-quantity-error" className="text-xs text-destructive">
                      {errors.stock_quantity}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">{copy.lowStockThresholdLabel}</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min={0}
                  value={values.low_stock_threshold}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.low_stock_threshold)}
                  aria-describedby={
                    errors.low_stock_threshold ? "low-stock-threshold-error" : "low-stock-help"
                  }
                  onChange={(event) => update("low_stock_threshold", Number(event.target.value))}
                />
                {errors.low_stock_threshold ? (
                  <p id="low-stock-threshold-error" className="text-xs text-destructive">
                    {errors.low_stock_threshold}
                  </p>
                ) : (
                  <p id="low-stock-help" className="text-xs leading-relaxed text-muted-foreground">
                    {copy.lowStockThresholdHelp}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <Label htmlFor="allow_backorder" className="cursor-pointer text-sm font-medium">
                  {copy.allowBackorderLabel}
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {copy.allowBackorderHelp}
                </p>
              </div>
              <Switch
                id="allow_backorder"
                checked={values.allow_backorder}
                disabled={disabled}
                onCheckedChange={(checked) => update("allow_backorder", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="out_of_stock_behavior">{copy.outOfStockBehaviorLabel}</Label>
              <Select
                value={values.out_of_stock_behavior}
                disabled={disabled || values.allow_backorder}
                onValueChange={(value) =>
                  update(
                    "out_of_stock_behavior",
                    value as ProductEditorFieldsProps["values"]["out_of_stock_behavior"],
                  )
                }
              >
                <SelectTrigger id="out_of_stock_behavior" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_OUT_OF_STOCK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {values.allow_backorder
                  ? copy.backorderOverridesVisibility
                  : copy.outOfStockBehaviorHelp}
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-accent/20 bg-accent/8 p-4 text-sm leading-relaxed text-accent">
            {copy.untrackedResult}
          </p>
        )}
      </div>
    </ProductEditorSection>
  );
}
