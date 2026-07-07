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
  calculateOrder,
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
  type ProductRow,
} from "../../src/server/flow/supabase.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const env = getFlowServerEnv();
    const supabase = createSupabaseAdmin(env);
    const body = parseCreatePaymentBody(await parseJsonBody(req));
    const requestedItems = aggregateRequestedItems(body.items);
    const userId = await getAuthenticatedUserId(supabase, req.headers.authorization);

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id,name,slug,price,currency,is_active,availability,stock_quantity,track_inventory,allow_backorder,low_stock_threshold,out_of_stock_behavior",
      )
      .in("id", Array.from(requestedItems.keys()));

    if (productsError) {
      throw new ApiError(500, "Could not load products");
    }

    const calculatedOrder = calculateOrder(requestedItems, (products ?? []) as ProductRow[]);
    const commerceOrder = buildCommerceOrder();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        commerce_order: commerceOrder,
        user_id: userId,
        status: "pending",
        currency: calculatedOrder.currency,
        subtotal: calculatedOrder.subtotal,
        discount_total: 0,
        shipping_total: 0,
        tax_total: 0,
        total: calculatedOrder.total,
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone || null,
        customer_comment: body.customer.comment || null,
      })
      .select("id, commerce_order, public_lookup_token")
      .single();

    if (orderError || !order) {
      throw new ApiError(500, "Could not create order");
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      calculatedOrder.items.map((item) => ({
        ...item,
        order_id: order.id,
      })),
    );

    if (itemsError) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      throw new ApiError(500, "Could not create order items");
    }

    let flowResponse: FlowCreatePaymentResponse;
    let redirectUrl: string;

    try {
      flowResponse = await createFlowPayment(env, {
        commerceOrder,
        subject: `Pedido ${commerceOrder}`,
        currency: calculatedOrder.currency,
        amount: calculatedOrder.total,
        email: body.customer.email,
        urlReturn: buildOrderReturnUrl(env.flowReturnUrl, commerceOrder, order.public_lookup_token),
        optional: JSON.stringify({
          commerceOrder,
          publicLookupToken: order.public_lookup_token,
        }),
      });
      redirectUrl = buildFlowRedirectUrl(flowResponse);
    } catch (error) {
      await supabase
        .from("orders")
        .update({
          status: "failed",
          flow_raw_status: {
            source: "payment/create",
            error: error instanceof Error ? error.message : "Flow request failed",
          },
          failed_at: new Date().toISOString(),
        })
        .eq("id", order.id);
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
      .eq("id", order.id);

    if (updateError) {
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
