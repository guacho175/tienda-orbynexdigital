import { accountConfig } from "@/config/account.config";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AccountOrderItem = Pick<
  Tables<"order_items">,
  "id" | "product_name" | "quantity" | "subtotal" | "currency"
>;

export type AccountOrder = Pick<
  Tables<"orders">,
  | "id"
  | "commerce_order"
  | "status"
  | "currency"
  | "total"
  | "created_at"
  | "paid_at"
  | "public_lookup_token"
> & {
  order_items: AccountOrderItem[];
};

export type LinkGuestOrdersResult = {
  linkedOrders: number;
};

export async function fetchCurrentUserOrders(): Promise<AccountOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, commerce_order, status, currency, total, created_at, paid_at, public_lookup_token, order_items(id, product_name, quantity, subtotal, currency)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AccountOrder[];
}

export async function linkGuestOrdersToCurrentUser(): Promise<LinkGuestOrdersResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Necesitas iniciar sesion para cargar tus pedidos.");
  }

  const response = await fetch("/api/account/link-orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    linkedOrders?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? accountConfig.dashboard.unconfirmedDescription);
  }

  return { linkedOrders: payload.linkedOrders ?? 0 };
}
