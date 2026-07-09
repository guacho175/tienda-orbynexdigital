import { z } from "zod";
import { productEditorConfig } from "@/config/product-editor.config";

const optionalUrl = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => value === "" || z.string().url().safeParse(value).success, "URL invalida");

export const productEditorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(productEditorConfig.characterLimits.name),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es obligatorio")
    .max(productEditorConfig.characterLimits.slug)
    .regex(/^[a-z0-9-]+$/, "Usa solo minusculas, numeros y guiones"),
  short_description: z.string().trim().max(productEditorConfig.characterLimits.short_description),
  description: z.string().trim().max(productEditorConfig.characterLimits.description),
  meta_title: z.string().trim().max(productEditorConfig.characterLimits.meta_title),
  meta_description: z.string().trim().max(productEditorConfig.characterLimits.meta_description),
  seo_noindex: z.boolean(),
  og_image_url: optionalUrl(productEditorConfig.characterLimits.og_image_url),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  currency: z
    .string()
    .trim()
    .min(3)
    .max(6)
    .refine(
      (value) =>
        !productEditorConfig.currency.locked ||
        (productEditorConfig.currency.options as readonly string[]).includes(value),
      "Selecciona una moneda compatible con el pago online activo",
    ),
  category: z.string().trim().max(productEditorConfig.characterLimits.category),
  image_url: optionalUrl(),
  image_url_thumb: optionalUrl(),
  image_url_card: optionalUrl(),
  image_url_detail: optionalUrl(),
  is_active: z.boolean(),
  availability: z.enum(["in_stock", "out_of_stock", "on_demand"]),
  stock_quantity: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  track_inventory: z.boolean(),
  allow_backorder: z.boolean(),
  low_stock_threshold: z.coerce.number().int().min(0, "El umbral no puede ser negativo"),
  out_of_stock_behavior: z.enum(["show_sold_out", "hide_product"]),
  payment_url: optionalUrl(),
  payment_button_label: z
    .string()
    .trim()
    .max(productEditorConfig.characterLimits.payment_button_label),
  display_order: z.coerce.number().int().min(0, "El orden no puede ser negativo"),
});

export type ProductEditorValues = z.infer<typeof productEditorSchema>;
