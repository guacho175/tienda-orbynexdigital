import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  getQueryParam,
  handleApiError,
  parseFormBody,
  sendJson,
} from "../../src/server/flow/http.js";
import { getFlowServerEnv } from "../../src/server/flow/env.js";
import {
  getFlowPaymentStatus,
  mapFlowStatusToLocal,
} from "../../src/server/flow/flow.js";
import { createSupabaseAdmin, type OrderRow } from "../../src/server/flow/supabase.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const env = getFlowServerEnv();
    const supabase = createSupabaseAdmin(env);
    const formBody = await parseFormBody(req);
    const token = formBody.token || getQueryParam(req, "token");

    if (!token) {
      throw new ApiError(400, "Missing Flow token");
    }

    const flowStatus = await getFlowPaymentStatus(env, token);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, commerce_order, status, currency, total, flow_token, flow_url, flow_status, public_lookup_token, paid_at, confirmed_at, failed_at, expires_at, created_at",
      )
      .eq("flow_token", token)
      .single();

    if (orderError || !order) {
      throw new ApiError(404, "Order not found for Flow token");
    }

    const typedOrder = order as OrderRow;
    validateFlowStatusMatchesOrder(flowStatus, typedOrder);

    const localStatus = mapFlowStatusToLocal(flowStatus.status);
    const now = new Date().toISOString();

    if (typedOrder.status === "paid") {
      sendJson(res, 200, {
        ok: true,
        status: "paid",
        commerceOrder: typedOrder.commerce_order,
        idempotent: true,
      });
      return;
    }

    const updatePayload: Record<string, unknown> = {
      status: localStatus,
      flow_status: String(flowStatus.status ?? ""),
      flow_raw_status: flowStatus,
      confirmed_at: now,
    };

    if (localStatus === "paid") {
      updatePayload.paid_at = now;
    }
    if (localStatus === "failed") {
      updatePayload.failed_at = now;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", typedOrder.id);

    if (updateError) {
      throw new ApiError(500, "Could not update order status");
    }

    sendJson(res, 200, {
      ok: true,
      status: localStatus,
      commerceOrder: typedOrder.commerce_order,
    });
  } catch (error) {
    await handleApiError(res, error, "Could not confirm Flow payment");
  }
}

function validateFlowStatusMatchesOrder(
  flowStatus: Record<string, unknown>,
  order: OrderRow,
) {
  if (
    typeof flowStatus.commerceOrder === "string" &&
    flowStatus.commerceOrder !== order.commerce_order
  ) {
    throw new ApiError(409, "Flow commerceOrder does not match local order");
  }

  if (typeof flowStatus.currency === "string" && flowStatus.currency !== order.currency) {
    throw new ApiError(409, "Flow currency does not match local order");
  }

  if (
    flowStatus.amount !== undefined &&
    Number(flowStatus.amount) !== Number(order.total)
  ) {
    throw new ApiError(409, "Flow amount does not match local order");
  }
}
