import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const ADMIN_ORDER_STATUSES = [
  "pending",
  "stock_reserved",
  "redirected",
  "paid",
  "failed",
  "cancelled",
  "expired",
  "reservation_expired",
  "stock_conflict",
  "requires_manual_review",
] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export type AdminOrderItem = Pick<
  Tables<"order_items">,
  | "id"
  | "product_id"
  | "product_name"
  | "product_slug"
  | "unit_price"
  | "quantity"
  | "subtotal"
  | "currency"
>;

export type AdminOrder = Pick<
  Tables<"orders">,
  | "id"
  | "commerce_order"
  | "status"
  | "currency"
  | "subtotal"
  | "discount_total"
  | "shipping_total"
  | "tax_total"
  | "total"
  | "customer_name"
  | "customer_email"
  | "customer_phone"
  | "customer_comment"
  | "created_at"
  | "updated_at"
  | "paid_at"
  | "confirmed_at"
  | "failed_at"
  | "expires_at"
  | "user_id"
> & {
  order_items: AdminOrderItem[];
};

export interface FetchAdminOrdersParams {
  page?: number;
  pageSize?: number;
  status?: AdminOrderStatus | "all";
  search?: string;
  from?: string;
  to?: string;
}

export interface AdminOrdersResult {
  orders: AdminOrder[];
  total: number;
}

const ADMIN_ORDERS_SELECT = `
  id,
  commerce_order,
  status,
  currency,
  subtotal,
  discount_total,
  shipping_total,
  tax_total,
  total,
  customer_name,
  customer_email,
  customer_phone,
  customer_comment,
  created_at,
  updated_at,
  paid_at,
  confirmed_at,
  failed_at,
  expires_at,
  user_id,
  order_items (
    id,
    product_id,
    product_name,
    product_slug,
    unit_price,
    quantity,
    subtotal,
    currency
  )
`;

export async function fetchAdminOrders({
  page = 0,
  pageSize = 20,
  status = "all",
  search,
  from,
  to,
}: FetchAdminOrdersParams = {}): Promise<AdminOrdersResult> {
  const safePage = Math.max(0, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const rangeFrom = safePage * safePageSize;
  const rangeTo = rangeFrom + safePageSize - 1;

  let query = supabase
    .from("orders")
    .select(ADMIN_ORDERS_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (from) {
    query = query.gte("created_at", `${from}T00:00:00.000Z`);
  }

  if (to) {
    query = query.lte("created_at", `${to}T23:59:59.999Z`);
  }

  const sanitizedSearch = sanitizeSearch(search);
  if (sanitizedSearch) {
    const pattern = `%${sanitizedSearch}%`;
    query = query.or(
      `commerce_order.ilike.${pattern},customer_email.ilike.${pattern},customer_name.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    orders: (data ?? []) as AdminOrder[],
    total: count ?? 0,
  };
}

function sanitizeSearch(value?: string) {
  return value
    ?.trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}
