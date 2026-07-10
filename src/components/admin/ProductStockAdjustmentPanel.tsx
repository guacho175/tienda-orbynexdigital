import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ClipboardList, Minus, Plus } from "lucide-react";
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

type StockOperation = "stock_entry" | "external_sale" | "correction" | "return";
type CorrectionDirection = "increase" | "decrease";

const MOVEMENT_LABELS: Record<string, string> = {
  manual_adjustment: "Movimiento manual",
  manual_return: "Devolución",
  manual_correction: "Corrección",
  flow_sale: "Venta checkout Flow",
  reservation_created: "Reserva creada",
  reservation_released: "Reserva liberada",
};

const OPERATION_CONFIG: Record<
  StockOperation,
  { label: string; movementType: ManualStockMovementType; reasonLabel: string }
> = {
  stock_entry: {
    label: "Entrada de stock",
    movementType: "manual_adjustment",
    reasonLabel: "Entrada de stock",
  },
  external_sale: {
    label: "Venta externa",
    movementType: "manual_adjustment",
    reasonLabel: "Venta externa",
  },
  correction: {
    label: "Corrección",
    movementType: "manual_correction",
    reasonLabel: "Corrección",
  },
  return: {
    label: "Devolución",
    movementType: "manual_return",
    reasonLabel: "Devolución",
  },
};

function getMovementLabel(movementType: string, reason: string | null) {
  const semanticLabel = Object.values(OPERATION_CONFIG).find(({ reasonLabel }) =>
    reason?.startsWith(reasonLabel),
  )?.label;
  return semanticLabel ?? MOVEMENT_LABELS[movementType] ?? movementType;
}

function formatMovementReason(operation: StockOperation, reason: string) {
  const label = OPERATION_CONFIG[operation].reasonLabel;
  const detail = reason.trim();
  return detail ? `${label}: ${detail}` : label;
}

export function ProductStockAdjustmentPanel({ product }: ProductStockAdjustmentPanelProps) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [operation, setOperation] = useState<StockOperation>("stock_entry");
  const [correctionDirection, setCorrectionDirection] = useState<CorrectionDirection>("increase");
  const parsedQuantity = useMemo(() => Math.abs(Number.parseInt(quantity, 10) || 0), [quantity]);
  const parsedDelta = useMemo(() => {
    if (operation === "external_sale") return -parsedQuantity;
    if (operation === "correction" && correctionDirection === "decrease") {
      return -parsedQuantity;
    }
    return parsedQuantity;
  }, [correctionDirection, operation, parsedQuantity]);

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", product.id],
    queryFn: () => fetchStockMovements(product.id),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const updatedProduct = await adjustProductStock({
        productId: product.id,
        quantityDelta: parsedDelta,
        reason: formatMovementReason(operation, reason),
        movementType: OPERATION_CONFIG[operation].movementType,
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
        toast.warning("Stock actualizado sin auditoría de producto", {
          description:
            error instanceof Error ? error.message : "No se pudo registrar el evento de auditoría.",
        });
      }

      return updatedProduct;
    },
    onSuccess: () => {
      setQuantity("1");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", product.id] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", product.id] });
      queryClient.invalidateQueries({ queryKey: ["product-audit-events"] });
      toast.success("Movimiento registrado", {
        description: "El stock y su historial quedaron actualizados.",
      });
    },
    onError: (err: Error) => {
      toast.error("No se pudo registrar el movimiento", {
        description: err.message || "Revisa las unidades e intenta nuevamente.",
      });
    },
  });

  const nextStock = Number(product.stock_quantity) + parsedDelta;
  const canSubmit = parsedQuantity > 0 && nextStock >= 0 && !mutation.isPending;

  return (
    <Card className="rounded-xl border-slate-200 bg-slate-50 shadow-none">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowDownToLine className="h-5 w-5" />
          Registrar movimiento
        </CardTitle>
        <CardDescription>
          Cada entrada o salida actualiza el stock y queda registrada en el historial.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 pt-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
            <p className="font-medium">Checkout interno y ventas externas</p>
            <p className="mt-1 leading-relaxed">
              Las ventas del checkout interno Flow se descuentan automáticamente al confirmarse el
              pago. Las compras hechas por link de pago externo u otro canal deben registrarse como
              <strong> Venta externa</strong>.
            </p>
            {product.payment_url ? (
              <Badge variant="outline" className="mt-3 border-cyan-300 bg-white text-cyan-900">
                Link de pago externo activo
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Stock actual</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{product.stock_quantity}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Movimiento</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {parsedDelta > 0 ? "+" : ""}
                {parsedDelta}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Stock resultante</p>
              <p
                className={
                  nextStock < 0
                    ? "mt-1 text-xl font-semibold text-destructive"
                    : "mt-1 text-xl font-semibold text-foreground"
                }
              >
                {nextStock}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)]">
            <select
              value={operation}
              onChange={(event) => setOperation(event.target.value as StockOperation)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950"
              disabled={mutation.isPending}
              aria-label="Tipo de movimiento"
            >
              <option value="stock_entry">Entrada de stock</option>
              <option value="external_sale">Venta externa</option>
              <option value="correction">Corrección</option>
              <option value="return">Devolución</option>
            </select>
            {operation === "correction" ? (
              <select
                value={correctionDirection}
                onChange={(event) =>
                  setCorrectionDirection(event.target.value as CorrectionDirection)
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950"
                disabled={mutation.isPending}
                aria-label="Dirección de la corrección"
              >
                <option value="increase">Sumar unidades</option>
                <option value="decrease">Rebajar unidades</option>
              </select>
            ) : (
              <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-muted-foreground">
                {operation === "external_sale" ? "Rebaja unidades" : "Suma unidades"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuantity(String(Math.max(0, parsedQuantity - 1)))}
              disabled={mutation.isPending || parsedQuantity <= 0}
              aria-label="Reducir cantidad"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={mutation.isPending}
              aria-label="Unidades del movimiento"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuantity(String(parsedQuantity + 1))}
              disabled={mutation.isPending}
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {nextStock < 0 ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              No hay stock suficiente. La rebaja supera las {product.stock_quantity} unidades
              disponibles y no se puede registrar.
            </p>
          ) : null}

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Detalle opcional, por ejemplo número de pedido o proveedor"
            aria-label="Detalle del movimiento"
            disabled={mutation.isPending}
          />

          <Button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit}>
            Registrar {OPERATION_CONFIG[operation].label.toLowerCase()}
          </Button>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4" />
            Últimos movimientos
          </h3>
          <div className="space-y-2">
            {(movementsQuery.data ?? []).map((movement) => (
              <div
                key={movement.id}
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">
                    {getMovementLabel(movement.movement_type, movement.reason)}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {movement.quantity_delta > 0 ? "+" : ""}
                    {movement.quantity_delta}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {movement.stock_before} {"→"} {movement.stock_after}
                  {movement.reason ? ` · ${movement.reason}` : ""}
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
