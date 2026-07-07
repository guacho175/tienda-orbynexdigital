import { createClient } from "@supabase/supabase-js";
import type { SupabaseServerEnv } from "./env.js";

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  currency: string;
  is_active: boolean;
  availability: string;
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  out_of_stock_behavior: string;
}

export interface OrderRow {
  id: string;
  commerce_order: string;
  status: string;
  currency: string;
  total: number | string;
  flow_token: string | null;
  flow_url: string | null;
  flow_status: string | null;
  public_lookup_token: string;
  paid_at: string | null;
  confirmed_at: string | null;
  failed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ConfirmOrderStockResult {
  success: boolean;
  message: string;
  status?: string;
}

export interface CreateOrderWithReservationResult {
  order_id: string;
  commerce_order: string;
  public_lookup_token: string;
  subtotal: number | string;
  total: number | string;
  currency: string;
}

export function createSupabaseAdmin(env: SupabaseServerEnv) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getAuthenticatedUserId(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  authorizationHeader: string | string[] | undefined,
): Promise<string | null> {
  if (!authorizationHeader || Array.isArray(authorizationHeader)) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user) return null;

  return data.user.id;
}
