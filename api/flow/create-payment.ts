import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  handleApiError,
  parseJsonBody,
  sendJson,
} from "../../src/server/flow/http.js";
import { getFlowServerEnv } from "../../src/server/flow/env.js";
import {
  buildCommerceOrder,
  aggregateRequestedItems,
  parseCreatePaymentBody,
} from "../../src/server/flow/checkout.js";
import {
  buildFlowRedirectUrl,
  createFlowPayment,
  type FlowCreatePaymentResponse,
} from "../../src/server/flow/flow.js";
import {
  createSupabaseAdmin,
  getAuthenticatedUserId,
  type CreateOrderWithReservationResult,
} from "../../src/server/flow/supabase.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const env = getFlowServerEnv();
    const supabase = createSupabaseAdmin(env);
    const body = parseCreatePaymentBody(await parseJsonBody(req));
    const requestedItems = aggregateRequestedItems(body.items);
    const itemsForReservation = Array.from(requestedItems, ([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const userId = await getAuthenticatedUserId(supabase, req.headers.authorization);
    const commerceOrder = buildCommerceOrder();

    const { data: orderResult, error: orderError } = await supabase.rpc(
      "create_order_with_stock_reservation",
      {
        p_user_id: userId,
        p_commerce_order: commerceOrder,
        p_customer: body.customer,
        p_items: itemsForReservation,
        p_reservation_minutes: 15,
      },
    );

    const order = Array.isArray(orderResult)
      ? (orderResult[0] as CreateOrderWithReservationResult | undefined)
      : (orderResult as CreateOrderWithReservationResult | undefined);

    if (orderError || !order) {
      throw new ApiError(409, orderError?.message ?? "Could not create order reservation");
    }

    let flowResponse: FlowCreatePaymentResponse;
    let redirectUrl: string;

    try {
      flowResponse = await createFlowPayment(env, {
        commerceOrder,
        subject: `Pedido ${commerceOrder}`,
        currency: order.currency,
        amount: Number(order.total),
        email: body.customer.email,
        urlReturn: buildOrderReturnUrl(env.flowReturnUrl, commerceOrder, order.public_lookup_token),
        optional: JSON.stringify({
          commerceOrder,
          publicLookupToken: order.public_lookup_token,
        }),
      });
      redirectUrl = buildFlowRedirectUrl(flowResponse);
    } catch (error) {
      const { error: releaseError } = await supabase.rpc("release_order_stock_reservations", {
        p_order_id: order.order_id,
        p_order_status: "failed",
        p_flow_status: {
          source: "payment/create",
          error: error instanceof Error ? error.message : "Flow request failed",
        },
        p_flow_status_text: "payment_create_failed",
      });

      if (releaseError) {
        throw new ApiError(500, "Could not release stock reservation after Flow failure");
      }

      throw error;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "redirected",
        flow_token: flowResponse.token,
        flow_url: redirectUrl,
        flow_status: "created",
        flow_raw_status: {
          source: "payment/create",
          flowOrder: flowResponse.flowOrder ?? null,
        },
      })
      .eq("id", order.order_id);

    if (updateError) {
      await supabase.rpc("release_order_stock_reservations", {
        p_order_id: order.order_id,
        p_order_status: "failed",
        p_flow_status: {
          source: "payment/create-local-update",
          error: updateError.message,
        },
        p_flow_status_text: "payment_create_update_failed",
      });
      throw new ApiError(500, "Could not update order with Flow response");
    }

    sendJson(res, 200, {
      redirectUrl,
      commerceOrder,
      publicLookupToken: order.public_lookup_token,
    });
  } catch (error) {
    await handleApiError(res, error, "Could not create Flow payment");
  }
}

function buildOrderReturnUrl(
  flowReturnUrl: string,
  commerceOrder: string,
  publicLookupToken: string,
) {
  const url = new URL(flowReturnUrl);
  url.searchParams.set("commerceOrder", commerceOrder);
  url.searchParams.set("publicLookupToken", publicLookupToken);
  url.searchParams.set("lookup", publicLookupToken);
  return url.toString();
}
