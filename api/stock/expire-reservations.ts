import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import { ApiError, assertMethod, handleApiError, sendJson } from "../../src/server/flow/http.js";
import { getCronSecret, getSupabaseServerEnv } from "../../src/server/flow/env.js";
import { createSupabaseAdmin } from "../../src/server/flow/supabase.js";

type ExpireStockReservationsResult = {
  expired_reservations: number;
  expired_orders: number;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "GET");

    const cronSecret = getCronSecret();
    if (!cronSecret) {
      throw new ApiError(503, "Cron is not configured");
    }

    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      throw new ApiError(401, "Unauthorized");
    }

    const supabase = createSupabaseAdmin(getSupabaseServerEnv());
    const { data, error } = await supabase.rpc("expire_stock_reservations");

    if (error) {
      throw new ApiError(500, "Could not expire stock reservations");
    }

    const result = Array.isArray(data)
      ? (data[0] as ExpireStockReservationsResult | undefined)
      : (data as ExpireStockReservationsResult | undefined);

    sendJson(res, 200, {
      ok: true,
      expiredReservations: result?.expired_reservations ?? 0,
      expiredOrders: result?.expired_orders ?? 0,
    });
  } catch (error) {
    await handleApiError(res, error, "Could not expire stock reservations");
  }
}
