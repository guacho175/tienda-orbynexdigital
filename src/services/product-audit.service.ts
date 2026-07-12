import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import type { Product } from "@/types/product";
import {
  PRODUCT_AVAILABILITY_OPTIONS,
  PRODUCT_OUT_OF_STOCK_OPTIONS,
} from "@/config/product-editor.config";
import { commerceConfig } from "@/config/commerce.config";
import { formatCurrency } from "@/utils/currency";

export type ProductAuditEvent = Tables<"product_audit_events">;

export interface ProductAuditEventsPage {
  events: ProductAuditEvent[];
  total: number;
}

export interface ProductAuditChange {
  field: string;
  label: string;
  beforeValue: string;
  afterValue: string;
}

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

const FIELD_LABELS: Record<string, string> = {
  product: "Ficha del producto",
  name: "Nombre",
  slug: "Direccion publica",
  short_description: "Descripcion corta",
  description: "Descripcion completa",
  meta_title: "Titulo para Google y redes",
  meta_description: "Descripcion para Google y redes",
  seo_noindex: "Visibilidad en buscadores",
  og_image_url: "Imagen para compartir",
  price: "Precio",
  currency: "Moneda",
  category: "Categoria",
  image_url: "Imagen principal",
  image_url_thumb: "Imagen miniatura",
  image_url_card: "Imagen de tarjeta",
  image_url_detail: "Imagen de detalle",
  is_active: "Publicacion",
  availability: "Estado de venta",
  stock_quantity: "Stock registrado",
  track_inventory: "Control de inventario",
  allow_backorder: "Venta sin stock",
  low_stock_threshold: "Aviso de pocas unidades",
  out_of_stock_behavior: "Accion al quedar sin stock",
  payment_url: "URL de pago externo",
  payment_button_label: "Texto del boton de pago",
  display_order: "Orden de aparicion",
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  availability: Object.fromEntries(
    PRODUCT_AVAILABILITY_OPTIONS.map((option) => [option.value, option.label]),
  ),
  out_of_stock_behavior: Object.fromEntries(
    PRODUCT_OUT_OF_STOCK_OPTIONS.map((option) => [option.value, option.label]),
  ),
};

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

export async function fetchProductAuditEvents({
  page = 0,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<ProductAuditEventsPage> {
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("product_audit_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    events: data ?? [],
    total: count ?? 0,
  };
}

export function getChangedProductFields(before: Product, after: Product) {
  return AUDITED_FIELDS.filter((field) => {
    const beforeValue = before[field];
    const afterValue = after[field];
    return JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null);
  }).map(String);
}

export function getAuditProductName(event: ProductAuditEvent) {
  return (
    getSnapshotString(event.after_snapshot, "name") ??
    getSnapshotString(event.before_snapshot, "name") ??
    event.product_id
  );
}

export function getAuditChangeSummary(event: ProductAuditEvent) {
  if (event.event_type === "product_create") return "Producto creado en el catalogo.";
  if (event.event_type === "stock_adjustment") return "Movimiento de stock registrado.";
  return "Producto actualizado.";
}

export function getAuditChanges(event: ProductAuditEvent): ProductAuditChange[] {
  if (event.event_type === "product_create") {
    return [
      {
        field: "product",
        label: FIELD_LABELS.product,
        beforeValue: "No existia",
        afterValue: getSnapshotString(event.after_snapshot, "name") ?? "Producto creado",
      },
    ];
  }

  return event.changed_fields.map((field) => ({
    field,
    label: getAuditFieldLabel(field),
    beforeValue: formatAuditValue(field, getSnapshotValue(event.before_snapshot, field), event),
    afterValue: formatAuditValue(field, getSnapshotValue(event.after_snapshot, field), event),
  }));
}

export function getAuditFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? humanizeFieldName(field);
}

function getSnapshotString(snapshot: Json, field: string) {
  const value = getSnapshotValue(snapshot, field);
  return typeof value === "string" && value.trim() ? value : null;
}

function getSnapshotValue(snapshot: Json, field: string): Json | undefined {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return undefined;
  return (snapshot as Record<string, Json>)[field];
}

function formatAuditValue(field: string, value: Json | undefined, event: ProductAuditEvent) {
  if (value === undefined || value === null || value === "") return "Sin valor";

  if (field === "price" && (typeof value === "number" || typeof value === "string")) {
    const currency =
      getSnapshotString(event.after_snapshot, "currency") ??
      getSnapshotString(event.before_snapshot, "currency") ??
      commerceConfig.currency;
    return formatCurrency(Number(value), currency, commerceConfig.locale);
  }

  if (field === "is_active") {
    return value === true ? "Publicado" : "Sin publicar";
  }

  if (field === "seo_noindex") {
    return value === true ? "Oculto de buscadores" : "Visible en buscadores";
  }

  if (field === "track_inventory") {
    return value === true ? "Cuenta unidades" : "No descuenta unidades";
  }

  if (field === "allow_backorder") {
    return value === true ? "Permite venta sin stock" : "No permite venta sin stock";
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "string") {
    return VALUE_LABELS[field]?.[value] ?? truncateValue(value);
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat(commerceConfig.locale).format(value);
  }

  return truncateValue(JSON.stringify(value));
}

function humanizeFieldName(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function truncateValue(value: string, maxLength = 96) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}
