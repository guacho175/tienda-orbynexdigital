import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  handleApiError,
  parseJsonBody,
  sendJson,
} from "../../src/server/flow/http.js";
import { getSupabaseServerEnv } from "../../src/server/flow/env.js";
import { createSupabaseAdmin } from "../../src/server/flow/supabase.js";

type AvailabilityRequestBody = {
  productIds?: unknown;
};

type ProductAvailabilityRow = {
  id: string;
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  availability: string;
  is_active: boolean;
};

type StockReservationRow = {
  product_id: string;
  quantity: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PRODUCT_IDS = 100;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const body = (await parseJsonBody(req)) as AvailabilityRequestBody;
    const productIds = parseProductIds(body.productIds);

    if (productIds.length === 0) {
      sendJson(res, 200, { availability: [] });
      return;
    }

    const supabase = createSupabaseAdmin(getSupabaseServerEnv());
    const { error: expireError } = await supabase.rpc("expire_stock_reservations");

    if (expireError) {
      throw new ApiError(500, "Could not refresh product availability");
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, stock_quantity, track_inventory, allow_backorder, availability, is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (productsError) {
      throw new ApiError(500, "Could not load product availability");
    }

    const now = new Date().toISOString();
    const { data: reservations, error: reservationsError } = await supabase
      .from("stock_reservations")
      .select("product_id, quantity")
      .in("product_id", productIds)
      .eq("status", "active")
      .gt("expires_at", now);

    if (reservationsError) {
      throw new ApiError(500, "Could not load product reservations");
    }

    const reservedByProductId = new Map<string, number>();
    for (const reservation of (reservations ?? []) as StockReservationRow[]) {
      reservedByProductId.set(
        reservation.product_id,
        (reservedByProductId.get(reservation.product_id) ?? 0) + Number(reservation.quantity),
      );
    }

    const availability = ((products ?? []) as ProductAvailabilityRow[]).map((product) => {
      const reservedQuantity = reservedByProductId.get(product.id) ?? 0;
      const tracksFiniteStock = product.track_inventory && !product.allow_backorder;
      const availableQuantity = tracksFiniteStock
        ? Math.max(0, Number(product.stock_quantity) - reservedQuantity)
        : Number(product.stock_quantity);
      const temporarilyReserved =
        tracksFiniteStock &&
        product.is_active &&
        product.availability !== "out_of_stock" &&
        Number(product.stock_quantity) > 0 &&
        reservedQuantity > 0 &&
        availableQuantity === 0;

      return {
        productId: product.id,
        availableQuantity,
        canPurchase:
          product.is_active &&
          product.availability !== "out_of_stock" &&
          (!tracksFiniteStock || availableQuantity > 0),
        temporarilyReserved,
      };
    });

    sendJson(res, 200, { availability });
  } catch (error) {
    await handleApiError(res, error, "Could not load product availability");
  }
}

function parseProductIds(input: unknown) {
  if (!Array.isArray(input)) {
    throw new ApiError(400, "productIds must be an array");
  }

  if (input.length > MAX_PRODUCT_IDS) {
    throw new ApiError(400, `productIds cannot contain more than ${MAX_PRODUCT_IDS} ids`);
  }

  const productIds = Array.from(new Set(input));
  if (!productIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    throw new ApiError(400, "productIds must contain valid UUIDs");
  }

  return productIds as string[];
}
