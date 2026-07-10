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
} from "@/config/product-editor.config";
import type { Product } from "@/types/product";
import { ProductEditorSection } from "./ProductEditorSection";
import type { ProductEditorFieldsProps } from "./product-editor.types";

interface ProductInventorySectionProps extends ProductEditorFieldsProps {
  existingProduct?: Product | null;
  onOpenStockMovements: () => void;
}

function getInventoryStatus(values: ProductEditorFieldsProps["values"]) {
  if (values.availability === "out_of_stock") {
    return { label: "Agotado manualmente", className: "border-destructive/40 text-destructive" };
  }
  if (!values.track_inventory) {
    return { label: "Sin control de stock", className: "border-accent/30 text-accent" };
  }
  if (values.stock_quantity <= 0 && values.allow_backorder) {
    return { label: "Venta sin stock permitida", className: "border-amber-300/40 text-amber-200" };
  }
  if (values.stock_quantity <= 0) {
    return {
      label:
        values.out_of_stock_behavior === "hide_product" ? "Agotado y oculto" : "Agotado y visible",
      className: "border-destructive/40 text-destructive",
    };
  }
  if (!values.allow_backorder && values.stock_quantity <= values.low_stock_threshold) {
    return { label: "Pocas unidades", className: "border-amber-300/40 text-amber-200" };
  }
  return { label: "Disponible", className: "border-accent/30 text-accent" };
}

export function ProductInventorySection({
  values,
  errors,
  update,
  disabled,
  existingProduct,
  onOpenStockMovements,
}: ProductInventorySectionProps) {
  const isExistingProduct = Boolean(existingProduct);
  const registeredStock = existingProduct?.stock_quantity ?? values.stock_quantity;
  const status = getInventoryStatus({ ...values, stock_quantity: registeredStock });

  return (
    <ProductEditorSection
      title="Inventario"
      description="Configura la disponibilidad y las reglas que se aplicarán al guardar el producto."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Estado resultante</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              La disponibilidad manual tiene prioridad. Después se aplican control de stock,
              backorder y visibilidad al agotarse.
            </p>
          </div>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Disponibilidad comercial</Label>
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
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <Label htmlFor="track_inventory" className="cursor-pointer text-sm font-medium">
              Controlar inventario
            </Label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Desactívalo para servicios o productos sin límite de unidades.
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
            <Label htmlFor="stock_quantity">Stock registrado</Label>
            <Input id="stock_quantity" type="number" min={0} value={registeredStock} disabled />
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Para sumar, rebajar o corregir unidades usa Movimientos de stock. La configuración
                se aplicará al guardar sin reemplazar el stock registrado.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onOpenStockMovements}>
                Ir a Movimientos de stock
              </Button>
            </div>
          </div>
        ) : null}

        {values.track_inventory ? (
          <div className="space-y-4">
            <div className={isExistingProduct ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
              {!isExistingProduct ? (
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock inicial</Label>
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
                    Define las unidades disponibles al crear el producto.
                  </p>
                  {errors.stock_quantity ? (
                    <p id="stock-quantity-error" className="text-xs text-destructive">
                      {errors.stock_quantity}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Umbral de pocas unidades</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min={0}
                  value={values.low_stock_threshold}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.low_stock_threshold)}
                  aria-describedby={
                    errors.low_stock_threshold ? "low-stock-threshold-error" : undefined
                  }
                  onChange={(event) => update("low_stock_threshold", Number(event.target.value))}
                />
                {errors.low_stock_threshold ? (
                  <p id="low-stock-threshold-error" className="text-xs text-destructive">
                    {errors.low_stock_threshold}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <Label htmlFor="allow_backorder" className="cursor-pointer text-sm font-medium">
                  Permitir venta sin stock
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Permite comprar aunque el stock registrado sea cero.
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
              <Label htmlFor="out_of_stock_behavior">Cuando no haya stock</Label>
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
              {values.allow_backorder ? (
                <p className="text-xs text-muted-foreground">
                  Esta regla no se aplica mientras la venta sin stock esté permitida.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-accent/20 bg-accent/8 p-4 text-sm text-accent">
            Este producto seguirá disponible sin descontar unidades.
          </p>
        )}
      </div>
    </ProductEditorSection>
  );
}
