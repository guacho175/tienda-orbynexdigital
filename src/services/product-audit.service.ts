import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import type { Product } from "@/types/product";

export type ProductAuditEvent = Tables<"product_audit_events">;

const AUDITED_FIELDS: (keyof Product)[] = [
  "name",
  "slug",
  "short_description",
  "description",
  "meta_title",
  "meta_description",
  "seo_noindex",
  "og_image_url",
  "price",
  "category",
  "image_url",
  "image_url_thumb",
  "image_url_card",
  "image_url_detail",
  "is_active",
  "availability",
  "stock_quantity",
  "track_inventory",
  "allow_backorder",
  "low_stock_threshold",
  "out_of_stock_behavior",
  "payment_url",
  "payment_button_label",
  "display_order",
];

export async function createProductAuditEvent(params: {
  productId: string;
  eventType: string;
  before: Product | Record<string, never>;
  after: Product;
  changedFields?: string[];
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("No hay usuario autenticado para registrar auditoria.");

  const changedFields =
    params.changedFields ?? getChangedProductFields(params.before as Product, params.after);

  const { error } = await supabase.from("product_audit_events").insert({
    product_id: params.productId,
    event_type: params.eventType,
    before_snapshot: params.before as unknown as Json,
    after_snapshot: params.after as unknown as Json,
    changed_fields: changedFields,
    created_by: userId,
  });

  if (error) throw error;
}

export async function fetchProductAuditEvents(limit = 50): Promise<ProductAuditEvent[]> {
  const { data, error } = await supabase
    .from("product_audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export function getChangedProductFields(before: Product, after: Product) {
  return AUDITED_FIELDS.filter((field) => {
    const beforeValue = before[field];
    const afterValue = after[field];
    return JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null);
  }).map(String);
}
