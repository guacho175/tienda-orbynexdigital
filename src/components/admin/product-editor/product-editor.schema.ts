import { z } from "zod";
import { productEditorConfig } from "@/config/product-editor.config";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || z.string().url().safeParse(value).success, "URL inválida");

export const productEditorSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es obligatorio")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Usa solo minúsculas, números y guiones"),
  short_description: z.string().trim().max(200),
  description: z.string().trim().max(4000),
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
  category: z.string().trim().max(60),
  image_url: optionalUrl,
  image_url_thumb: optionalUrl,
  image_url_card: optionalUrl,
  image_url_detail: optionalUrl,
  is_active: z.boolean(),
  availability: z.enum(["in_stock", "out_of_stock", "on_demand"]),
  stock_quantity: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  track_inventory: z.boolean(),
  allow_backorder: z.boolean(),
  low_stock_threshold: z.coerce.number().int().min(0, "El umbral no puede ser negativo"),
  out_of_stock_behavior: z.enum(["show_sold_out", "hide_product"]),
  payment_url: optionalUrl,
  payment_button_label: z.string().trim().max(60),
  display_order: z.coerce.number().int().min(0, "El orden no puede ser negativo"),
});

export type ProductEditorValues = z.infer<typeof productEditorSchema>;
