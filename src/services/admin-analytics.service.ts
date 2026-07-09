import { fetchAllProductsAdmin } from "@/services/products.service";
import { supabase } from "@/integrations/supabase/client";
import { isLowStock, isSoldOut } from "@/utils/inventory";
import type { Tables } from "@/integrations/supabase/types";

type OrderRow = Pick<Tables<"orders">, "id" | "status" | "total" | "created_at" | "paid_at">;
type OrderItemRow = Pick<
  Tables<"order_items">,
  "product_id" | "product_name" | "quantity" | "subtotal"
>;

export interface AdminAnalyticsMetric {
  label: string;
  value: number;
  detail?: string;
}

export interface SalesByDateRow {
  date: string;
  orderCount: number;
  total: number;
}

export interface TopProductRow {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
}

export interface AdminAnalytics {
  metrics: AdminAnalyticsMetric[];
  salesByDate: SalesByDateRow[];
  topProducts: TopProductRow[];
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const [products, orders, orderItems] = await Promise.all([
    fetchAllProductsAdmin(),
    fetchOrdersForAnalytics(),
    fetchOrderItemsForAnalytics(),
  ]);

  const paidOrderIds = new Set(orders.filter((order) => order.status === "paid").map((o) => o.id));
  const paidOrders = orders.filter((order) => paidOrderIds.has(order.id));
  const paidItems = orderItems.filter((item) => paidOrderIds.has(item.order_id));

  return {
    metrics: [
      { label: "Productos activos", value: products.filter((p) => p.is_active).length },
      { label: "Productos inactivos", value: products.filter((p) => !p.is_active).length },
      { label: "Stock bajo", value: products.filter(isLowStock).length },
      { label: "Agotados", value: products.filter(isSoldOut).length },
      {
        label: "Sin imagen",
        value: products.filter((p) => !p.image_url && !p.image_url_card && !p.image_url_thumb)
          .length,
      },
      { label: "Ordenes totales", value: orders.length },
      {
        label: "Ordenes pagadas",
        value: paidOrders.length,
        detail: formatCurrency(sumBy(paidOrders, (order) => Number(order.total))),
      },
    ],
    salesByDate: buildSalesByDate(paidOrders),
    topProducts: buildTopProducts(paidItems),
  };
}

async function fetchOrdersForAnalytics(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id,status,total,created_at,paid_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function fetchOrderItemsForAnalytics(): Promise<(OrderItemRow & { order_id: string })[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("order_id,product_id,product_name,quantity,subtotal");

  if (error) throw error;
  return data ?? [];
}

function buildSalesByDate(orders: OrderRow[]): SalesByDateRow[] {
  const rows = new Map<string, SalesByDateRow>();

  for (const order of orders) {
    const date = toDateKey(order.paid_at ?? order.created_at);
    const current = rows.get(date) ?? { date, orderCount: 0, total: 0 };
    current.orderCount += 1;
    current.total += Number(order.total);
    rows.set(date, current);
  }

  return Array.from(rows.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);
}

function buildTopProducts(items: OrderItemRow[]): TopProductRow[] {
  const rows = new Map<string, TopProductRow>();

  for (const item of items) {
    const current = rows.get(item.product_id) ?? {
      productId: item.product_id,
      productName: item.product_name,
      quantity: 0,
      total: 0,
    };
    current.quantity += Number(item.quantity);
    current.total += Number(item.subtotal);
    rows.set(item.product_id, current);
  }

  return Array.from(rows.values())
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, 10);
}

function sumBy<T>(rows: T[], getValue: (row: T) => number) {
  return rows.reduce((total, row) => total + getValue(row), 0);
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}
