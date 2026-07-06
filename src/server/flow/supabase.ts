import { createClient } from "@supabase/supabase-js";
import type { FlowServerEnv } from "./env.js";

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  currency: string;
  is_active: boolean;
  availability: string;
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

export function createSupabaseAdmin(env: FlowServerEnv) {
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
