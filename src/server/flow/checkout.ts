import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "./http.js";
import { getFlowServerEnv, getCronSecret } from "./env.js";
import {
  createFlowPayment,
  buildFlowRedirectUrl,
  getFlowPaymentStatus,
  mapFlowStatusToLocal,
} from "./flow.js";
import {
  createSupabaseAdmin,
  getAuthenticatedUserId,
  type ProductRow,
  type OrderRow,
  type ConfirmOrderStockResult,
  type CreateOrderWithReservationResult,
} from "./supabase.js";

// Schemas
export const createPaymentBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional().nullable(),
    comment: z.string().trim().max(1000).optional().nullable(),
  }),
});

export type CreatePaymentBody = z.infer<typeof createPaymentBodySchema>;

export interface CalculatedOrderItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  currency: string;
}

export interface CalculatedOrder {
  items: CalculatedOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
}

export function parseCreatePaymentBody(input: unknown): CreatePaymentBody {
  const result = createPaymentBodySchema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, "Invalid checkout payload");
  }
  return {
    ...result.data,
    customer: {
      ...result.data.customer,
      email: result.data.customer.email.trim().toLowerCase(),
    },
  };
}

export function aggregateRequestedItems(items: CreatePaymentBody["items"]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  for (const quantity of quantities.values()) {
    if (quantity > 99) {
      throw new ApiError(400, "Invalid product quantity");
    }
  }

  return quantities;
}

export function calculateOrder(
  requestedItems: Map<string, number>,
  products: ProductRow[],
): CalculatedOrder {
  const productsById = new Map(products.map((product) => [product.id, product]));

  if (productsById.size !== requestedItems.size) {
    throw new ApiError(400, "One or more products do not exist");
  }

  const calculatedItems: CalculatedOrderItem[] = [];

  for (const [productId, quantity] of requestedItems) {
    const product = productsById.get(productId);
    if (!product) throw new ApiError(400, "Product not found");
    if (!product.is_active) throw new ApiError(409, "Product is not active");
    if (product.availability === "out_of_stock") {
      throw new ApiError(409, `${product.name} esta agotado.`);
    }
    if (product.track_inventory && !product.allow_backorder && product.stock_quantity <= 0) {
      throw new ApiError(409, `${product.name} esta agotado.`);
    }
    if (product.track_inventory && !product.allow_backorder && quantity > product.stock_quantity) {
      throw new ApiError(
        409,
        `${product.name} no tiene stock suficiente. Stock disponible: ${product.stock_quantity}.`,
      );
    }
    if (product.currency !== "CLP") {
      throw new ApiError(409, "Only CLP products are supported for Flow checkout");
    }

    const unitPrice = toMoney(product.price);
    const subtotal = toMoney(unitPrice * quantity);

    calculatedItems.push({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      unit_price: unitPrice,
      quantity,
      subtotal,
      currency: product.currency,
    });
  }

  const subtotal = toMoney(calculatedItems.reduce((sum, item) => sum + item.subtotal, 0));

  if (subtotal <= 0) {
    throw new ApiError(400, "Order total must be greater than zero");
  }

  if (!Number.isInteger(subtotal)) {
    throw new ApiError(409, "CLP Flow payments require an integer amount");
  }

  return {
    items: calculatedItems,
    subtotal,
    total: subtotal,
    currency: "CLP",
  };
}

export function buildCommerceOrder(): string {
  const random = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `ORD-${Date.now()}-${random}`;
}

function toMoney(value: number | string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ApiError(409, "Invalid product price");
  }
  return Math.round(numeric * 100) / 100;
}

// =========================================================================
// WORKFLOWS DE NEGOCIO PORTABLES (SERVER-SIDE)
// =========================================================================

export interface CreatePaymentWorkflowParams {
  payload: unknown;
  authorizationHeader?: string;
}

export interface CreatePaymentWorkflowResult {
  redirectUrl: string;
  commerceOrder: string;
  publicLookupToken: string;
}

export async function createPaymentWorkflow(
  params: CreatePaymentWorkflowParams,
): Promise<CreatePaymentWorkflowResult> {
  const env = getFlowServerEnv();
  const supabase = createSupabaseAdmin(env);
  const body = parseCreatePaymentBody(params.payload);
  const requestedItems = aggregateRequestedItems(body.items);
  const itemsForReservation = Array.from(requestedItems, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
  const userId = await getAuthenticatedUserId(supabase, params.authorizationHeader);
  const commerceOrder = buildCommerceOrder();

  const { data: orderResult, error: orderError } = await supabase.rpc(
    "create_order_with_stock_reservation",
    {
      p_user_id: userId,
      p_commerce_order: commerceOrder,
      p_customer: body.customer,
      p_items: itemsForReservation,
      p_reservation_minutes: 10,
    },
  );

  const order = Array.isArray(orderResult)
    ? (orderResult[0] as CreateOrderWithReservationResult | undefined)
    : (orderResult as CreateOrderWithReservationResult | undefined);

  if (orderError || !order) {
    throw new ApiError(409, orderError?.message ?? "Could not create order reservation");
  }

  let flowResponse;
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
    await supabase.rpc("release_order_stock_reservations", {
      p_order_id: order.order_id,
      p_order_status: "failed",
      p_flow_status: {
        source: "payment/create",
        error: error instanceof Error ? error.message : "Flow request failed",
      },
      p_flow_status_text: "payment_create_failed",
    });
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

  return {
    redirectUrl,
    commerceOrder,
    publicLookupToken: order.public_lookup_token,
  };
}

export interface ConfirmPaymentWorkflowParams {
  token: string;
}

export interface ConfirmPaymentWorkflowResult {
  ok: boolean;
  status: string;
  commerceOrder: string;
  idempotent?: boolean;
  inventoryConflict?: boolean;
  message?: string;
}

export async function confirmPaymentWorkflow(
  params: ConfirmPaymentWorkflowParams,
): Promise<ConfirmPaymentWorkflowResult> {
  const env = getFlowServerEnv();
  const supabase = createSupabaseAdmin(env);
  const flowStatus = await getFlowPaymentStatus(env, params.token);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, commerce_order, status, currency, total, flow_token, flow_url, flow_status, public_lookup_token, paid_at, confirmed_at, failed_at, expires_at, created_at",
    )
    .eq("flow_token", params.token)
    .single();

  if (orderError || !order) {
    throw new ApiError(404, "Order not found for Flow token");
  }

  const typedOrder = order as OrderRow;
  validateFlowStatusMatchesOrder(flowStatus, typedOrder);

  const localStatus = mapFlowStatusToLocal(flowStatus.status);
  const now = new Date().toISOString();

  // Caso 1: Compra ya fue pagada e idempotente
  if (typedOrder.status === "paid") {
    return {
      ok: true,
      status: "paid",
      commerceOrder: typedOrder.commerce_order,
      idempotent: true,
    };
  }

  // Caso 2: Duplicado en estado terminal
  if (isDuplicateTerminalStatus(typedOrder.status, localStatus)) {
    return {
      ok: true,
      status: typedOrder.status,
      commerceOrder: typedOrder.commerce_order,
      idempotent: true,
    };
  }

  // Caso 3: Estado operacional terminal pero flujo local diferente de pagado
  if (isOperationalTerminalStatus(typedOrder.status) && localStatus !== "paid") {
    return {
      ok: true,
      status: typedOrder.status,
      commerceOrder: typedOrder.commerce_order,
      idempotent: true,
    };
  }

  // Caso 4: Pago aprobado - Capturar inventario y confirmar orden
  if (localStatus === "paid") {
    const { data: stockResult, error: stockError } = await supabase.rpc(
      "confirm_order_payment_and_capture_stock",
      {
        p_order_id: typedOrder.id,
        p_flow_status: flowStatus,
        p_flow_status_text: String(flowStatus.status ?? ""),
      },
    );

    if (stockError) {
      throw new ApiError(500, "Could not confirm order inventory");
    }

    const result = Array.isArray(stockResult)
      ? (stockResult[0] as ConfirmOrderStockResult | undefined)
      : (stockResult as ConfirmOrderStockResult | undefined);

    if (!result?.success) {
      return {
        ok: false,
        status: result?.status ?? "requires_manual_review",
        commerceOrder: typedOrder.commerce_order,
        inventoryConflict: true,
        message: result?.message ?? "Order stock could not be confirmed",
      };
    }

    return {
      ok: true,
      status: "paid",
      commerceOrder: typedOrder.commerce_order,
    };
  }

  // Caso 5: Pago fallido, cancelado o expirado - Liberar inventario
  if (["failed", "cancelled", "expired"].includes(localStatus)) {
    const { error: releaseError } = await supabase.rpc("release_order_stock_reservations", {
      p_order_id: typedOrder.id,
      p_order_status: localStatus,
      p_flow_status: flowStatus,
      p_flow_status_text: String(flowStatus.status ?? ""),
    });

    if (releaseError) {
      throw new ApiError(500, "Could not release order stock reservation");
    }

    return {
      ok: true,
      status: localStatus,
      commerceOrder: typedOrder.commerce_order,
    };
  }

  // Caso 6: Actualización de estados transicionales intermedios
  const updatePayload: Record<string, unknown> = {
    status: localStatus,
    flow_status: String(flowStatus.status ?? ""),
    flow_raw_status: flowStatus,
    confirmed_at: now,
  };

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

  return {
    ok: true,
    status: localStatus,
    commerceOrder: typedOrder.commerce_order,
  };
}

export interface OrderStatusWorkflowParams {
  commerceOrder: string;
  publicLookupToken: string;
}

export async function orderStatusWorkflow(
  params: OrderStatusWorkflowParams,
): Promise<Record<string, unknown>> {
  const env = getFlowServerEnv();
  const supabase = createSupabaseAdmin(env);

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, commerce_order, status, currency, total, flow_token, flow_url, flow_status, public_lookup_token, paid_at, confirmed_at, failed_at, expires_at, created_at",
    )
    .eq("commerce_order", params.commerceOrder)
    .eq("public_lookup_token", params.publicLookupToken)
    .single();

  if (error || !order) {
    throw new ApiError(404, "Order not found");
  }

  const typedOrder = order as OrderRow;

  return {
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
  };
}

export interface ProductsAvailabilityWorkflowParams {
  productIds: string[];
}

export async function productsAvailabilityWorkflow(
  params: ProductsAvailabilityWorkflowParams,
): Promise<Record<string, unknown>[]> {
  const env = getFlowServerEnv();
  const supabase = createSupabaseAdmin(env);

  // Expira reservas antes de calcular stock disponible
  const { error: expireError } = await supabase.rpc("expire_stock_reservations");
  if (expireError) {
    throw new ApiError(500, "Could not refresh product availability");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, stock_quantity, track_inventory, allow_backorder, availability, is_active")
    .in("id", params.productIds)
    .eq("is_active", true);

  if (productsError) {
    throw new ApiError(500, "Could not load product availability");
  }

  const now = new Date().toISOString();
  const { data: reservations, error: reservationsError } = await supabase
    .from("stock_reservations")
    .select("product_id, quantity")
    .in("product_id", params.productIds)
    .eq("status", "active")
    .gt("expires_at", now);

  if (reservationsError) {
    throw new ApiError(500, "Could not load product reservations");
  }

  const reservedByProductId = new Map<string, number>();
  for (const reservation of (reservations ?? []) as { product_id: string; quantity: number }[]) {
    reservedByProductId.set(
      reservation.product_id,
      (reservedByProductId.get(reservation.product_id) ?? 0) + Number(reservation.quantity),
    );
  }

  return ((products ?? []) as ProductRow[]).map((product) => {
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
}

export interface ExpireReservationsWorkflowParams {
  authorizationHeader?: string;
}

export interface ExpireReservationsWorkflowResult {
  ok: boolean;
  expiredReservations: number;
  expiredOrders: number;
}

export async function expireReservationsWorkflow(
  params: ExpireReservationsWorkflowParams,
): Promise<ExpireReservationsWorkflowResult> {
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    throw new ApiError(503, "Cron is not configured");
  }

  if (params.authorizationHeader !== `Bearer ${cronSecret}`) {
    throw new ApiError(401, "Unauthorized");
  }

  const env = getFlowServerEnv();
  const supabase = createSupabaseAdmin(env);

  const { data, error } = await supabase.rpc("expire_stock_reservations");
  if (error) {
    throw new ApiError(500, "Could not expire stock reservations");
  }

  const result = Array.isArray(data)
    ? (data[0] as { expired_reservations?: number; expired_orders?: number } | undefined)
    : (data as { expired_reservations?: number; expired_orders?: number } | undefined);

  return {
    ok: true,
    expiredReservations: result?.expired_reservations ?? 0,
    expiredOrders: result?.expired_orders ?? 0,
  };
}

// Helpers locales
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

function isOperationalTerminalStatus(currentStatus: string) {
  return ["reservation_expired", "stock_conflict", "requires_manual_review"].includes(
    currentStatus,
  );
}

function isDuplicateTerminalStatus(currentStatus: string, nextStatus: string) {
  return (
    currentStatus === nextStatus &&
    ["paid", "failed", "cancelled", "expired", "requires_manual_review", "stock_conflict"].includes(
      currentStatus,
    )
  );
}

function validateFlowStatusMatchesOrder(flowStatus: Record<string, unknown>, order: OrderRow) {
  if (
    typeof flowStatus.commerceOrder === "string" &&
    flowStatus.commerceOrder !== order.commerce_order
  ) {
    throw new ApiError(409, "Flow commerceOrder does not match local order");
  }

  if (typeof flowStatus.currency === "string" && flowStatus.currency !== order.currency) {
    throw new ApiError(409, "Flow currency does not match local order");
  }

  if (flowStatus.amount !== undefined && Number(flowStatus.amount) !== Number(order.total)) {
    throw new ApiError(409, "Flow amount does not match local order");
  }
}
