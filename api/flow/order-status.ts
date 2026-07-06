import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  getQueryParam,
  handleApiError,
  sendJson,
} from "../../src/server/flow/http.js";
import { getFlowServerEnv } from "../../src/server/flow/env.js";
import { createSupabaseAdmin, type OrderRow } from "../../src/server/flow/supabase.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "GET");

    const commerceOrder = getQueryParam(req, "commerceOrder");
    const publicLookupToken =
      getQueryParam(req, "publicLookupToken") ??
      getQueryParam(req, "public_lookup_token");

    if (!commerceOrder || !publicLookupToken) {
      throw new ApiError(400, "Missing commerceOrder or publicLookupToken");
    }

    const env = getFlowServerEnv();
    const supabase = createSupabaseAdmin(env);
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, commerce_order, status, currency, total, flow_token, flow_url, flow_status, public_lookup_token, paid_at, confirmed_at, failed_at, expires_at, created_at",
      )
      .eq("commerce_order", commerceOrder)
      .eq("public_lookup_token", publicLookupToken)
      .single();

    if (error || !order) {
      throw new ApiError(404, "Order not found");
    }

    const typedOrder = order as OrderRow;

    sendJson(res, 200, {
      commerceOrder: typedOrder.commerce_order,
      status: typedOrder.status,
      flowStatus: typedOrder.flow_status,
      currency: typedOrder.currency,
      total: Number(typedOrder.total),
      paidAt: typedOrder.paid_at,
      confirmedAt: typedOrder.confirmed_at,
      failedAt: typedOrder.failed_at,
      expiresAt: typedOrder.expires_at,
      createdAt: typedOrder.created_at,
    });
  } catch (error) {
    await handleApiError(res, error, "Could not load order status");
  }
}
