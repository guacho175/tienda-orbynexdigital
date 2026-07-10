import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adjustProductStock,
  fetchStockMovements,
  type ManualStockMovementType,
} from "@/services/inventory.service";
import { createProductAuditEvent } from "@/services/product-audit.service";
import type { Product } from "@/types/product";

interface ProductStockAdjustmentPanelProps {
  product: Product;
}

const MOVEMENT_LABELS: Record<string, string> = {
  manual_adjustment: "Ajuste manual",
  manual_return: "Devolucion",
  manual_correction: "Correccion",
};

export function ProductStockAdjustmentPanel({ product }: ProductStockAdjustmentPanelProps) {
  const queryClient = useQueryClient();
  const [quantityDelta, setQuantityDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [movementType, setMovementType] = useState<ManualStockMovementType>("manual_adjustment");
  const parsedDelta = useMemo(() => Number.parseInt(quantityDelta, 10) || 0, [quantityDelta]);

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", product.id],
    queryFn: () => fetchStockMovements(product.id),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const updatedProduct = await adjustProductStock({
        productId: product.id,
        quantityDelta: parsedDelta,
        reason,
        movementType,
      });

      try {
        await createProductAuditEvent({
          productId: product.id,
          eventType: "stock_adjustment",
          before: product,
          after: updatedProduct,
          changedFields: ["stock_quantity", "track_inventory"],
        });
      } catch (error) {
        toast.warning("Stock ajustado sin auditoria de producto", {
          description:
            error instanceof Error ? error.message : "No se pudo registrar el evento de auditoria.",
        });
      }

      return updatedProduct;
    },
    onSuccess: () => {
      setQuantityDelta("0");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", product.id] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", product.id] });
      queryClient.invalidateQueries({ queryKey: ["product-audit-events"] });
      toast.success("Stock ajustado", {
        description: "El movimiento quedo registrado en inventario.",
      });
    },
    onError: (err: Error) => {
      toast.error("No se pudo ajustar el stock", {
        description: err.message || "Revisa el ajuste e intenta nuevamente.",
      });
    },
  });

  const nextStock = Number(product.stock_quantity) + parsedDelta;
  const canSubmit = parsedDelta !== 0 && nextStock >= 0 && !mutation.isPending;

  return (
    <Card className="rounded-xl border-slate-200 bg-slate-50 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5" />
          Inventario manual
        </CardTitle>
        <CardDescription>Ajusta stock desde admin y deja historial del movimiento.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Stock actual</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {product.stock_quantity}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Ajuste</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {parsedDelta > 0 ? "+" : ""}
                {parsedDelta}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Nuevo stock</p>
              <p
                className={
                  nextStock < 0
                    ? "mt-1 text-2xl font-semibold text-destructive"
                    : "mt-1 text-2xl font-semibold text-foreground"
                }
              >
                {nextStock}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[11rem_1fr]">
            <select
              value={movementType}
              onChange={(event) => setMovementType(event.target.value as ManualStockMovementType)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950"
              disabled={mutation.isPending}
              aria-label="Tipo de movimiento"
            >
              <option value="manual_adjustment">Ajuste manual</option>
              <option value="manual_return">Devolucion</option>
              <option value="manual_correction">Correccion</option>
            </select>
            <div className="grid grid-cols-[2.75rem_1fr_2.75rem] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuantityDelta(String(parsedDelta - 1))}
                disabled={mutation.isPending}
                aria-label="Restar una unidad"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                value={quantityDelta}
                onChange={(event) => setQuantityDelta(event.target.value)}
                disabled={mutation.isPending}
                aria-label="Cantidad de ajuste"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuantityDelta(String(parsedDelta + 1))}
                disabled={mutation.isPending}
                aria-label="Sumar una unidad"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo opcional"
            aria-label="Motivo del ajuste"
            disabled={mutation.isPending}
          />

          <Button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit}>
            Registrar ajuste
          </Button>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Ultimos movimientos</h3>
          <div className="space-y-2">
            {(movementsQuery.data ?? []).map((movement) => (
              <div
                key={movement.id}
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">
                    {MOVEMENT_LABELS[movement.movement_type] ?? movement.movement_type}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {movement.quantity_delta > 0 ? "+" : ""}
                    {movement.quantity_delta}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {movement.stock_before} {"->"} {movement.stock_after}
                  {movement.reason ? ` - ${movement.reason}` : ""}
                </p>
              </div>
            ))}
            {movementsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando movimientos...</p>
            ) : null}
            {!movementsQuery.isLoading && (movementsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
