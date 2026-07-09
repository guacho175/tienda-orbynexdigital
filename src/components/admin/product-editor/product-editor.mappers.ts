import { commerceConfig } from "@/config/commerce.config";
import type { ProductInput } from "@/services/products.service";
import type { Product } from "@/types/product";
import type { ProductEditorValues } from "./product-editor.schema";

export function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function createProductEditorValues(initial?: Product | null): ProductEditorValues {
  return {
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    short_description: initial?.short_description ?? "",
    description: initial?.description ?? "",
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
    seo_noindex: initial?.seo_noindex ?? false,
    og_image_url: initial?.og_image_url ?? "",
    price: initial?.price ?? 0,
    currency: initial?.currency ?? commerceConfig.currency,
    category: initial?.category ?? "",
    image_url: initial?.image_url ?? "",
    image_url_thumb: initial?.image_url_thumb ?? "",
    image_url_card: initial?.image_url_card ?? "",
    image_url_detail: initial?.image_url_detail ?? "",
    is_active: initial?.is_active ?? true,
    availability:
      (initial?.availability as ProductEditorValues["availability"] | undefined) ?? "in_stock",
    stock_quantity: initial?.stock_quantity ?? 0,
    track_inventory: initial?.track_inventory ?? false,
    allow_backorder: initial?.allow_backorder ?? false,
    low_stock_threshold: initial?.low_stock_threshold ?? 3,
    out_of_stock_behavior: initial?.out_of_stock_behavior ?? "show_sold_out",
    payment_url: initial?.payment_url ?? "",
    payment_button_label: initial?.payment_button_label ?? "",
    display_order: initial?.display_order ?? 0,
  };
}

export function toProductInput(values: ProductEditorValues): ProductInput {
  return {
    ...values,
    short_description: values.short_description || null,
    description: values.description || null,
    meta_title: values.meta_title || null,
    meta_description: values.meta_description || null,
    og_image_url: values.og_image_url || null,
    category: values.category || null,
    image_url: values.image_url || null,
    image_url_thumb: values.image_url_thumb || null,
    image_url_card: values.image_url_card || null,
    image_url_detail: values.image_url_detail || null,
    payment_url: values.payment_url || null,
    payment_button_label: values.payment_button_label || null,
  };
}
