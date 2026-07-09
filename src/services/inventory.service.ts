import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Product } from "@/types/product";

export type StockMovement = Tables<"stock_movements">;
export type ManualStockMovementType = "manual_adjustment" | "manual_return" | "manual_correction";

export async function adjustProductStock(params: {
  productId: string;
  quantityDelta: number;
  reason?: string;
  movementType?: ManualStockMovementType;
}): Promise<Product> {
  const quantityDelta = Math.trunc(params.quantityDelta);
  if (quantityDelta === 0) throw new Error("El ajuste debe ser distinto de cero.");

  const { data, error } = await supabase.rpc("adjust_product_stock_admin", {
    p_product_id: params.productId,
    p_quantity_delta: quantityDelta,
    p_reason: params.reason?.trim() || null,
    p_movement_type: params.movementType ?? "manual_adjustment",
  });

  if (error) throw error;
  return data as Product;
}

export async function fetchStockMovements(productId: string, limit = 8): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
