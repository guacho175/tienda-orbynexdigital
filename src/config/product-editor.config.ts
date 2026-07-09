import { commerceConfig } from "./commerce.config";

export const PRODUCT_EDITOR_SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Información principal que verá el cliente.",
  },
  {
    id: "inventory",
    label: "Inventario",
    description: "Disponibilidad, stock y reglas de compra.",
  },
  {
    id: "pricing",
    label: "Precios y pago",
    description: "Precio, moneda y enlace de pago alternativo.",
  },
  {
    id: "media",
    label: "Multimedia",
    description: "Imagen principal y variantes optimizadas.",
  },
  {
    id: "organization",
    label: "Organización",
    description: "Categoría, orden y visibilidad del producto.",
  },
  {
    id: "seo",
    label: "SEO básico",
    description: "Dirección pública del producto.",
  },
] as const;

export type ProductEditorSectionId = (typeof PRODUCT_EDITOR_SECTIONS)[number]["id"];

export const PRODUCT_EDITOR_FIELD_SECTION = {
  name: "general",
  short_description: "general",
  description: "general",
  availability: "inventory",
  stock_quantity: "inventory",
  track_inventory: "inventory",
  allow_backorder: "inventory",
  low_stock_threshold: "inventory",
  out_of_stock_behavior: "inventory",
  price: "pricing",
  currency: "pricing",
  payment_url: "pricing",
  payment_button_label: "pricing",
  image_url: "media",
  image_url_thumb: "media",
  image_url_card: "media",
  image_url_detail: "media",
  image_upload: "media",
  category: "organization",
  display_order: "organization",
  is_active: "organization",
  slug: "seo",
} as const satisfies Record<string, ProductEditorSectionId>;

export const PRODUCT_AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "Disponible" },
  { value: "out_of_stock", label: "Agotado manualmente" },
  { value: "on_demand", label: "Bajo pedido" },
] as const;

export const PRODUCT_OUT_OF_STOCK_OPTIONS = [
  { value: "show_sold_out", label: "Mantener visible como agotado" },
  { value: "hide_product", label: "Ocultar del catálogo" },
] as const;

export const productEditorConfig = {
  sections: PRODUCT_EDITOR_SECTIONS,
  currency: {
    options: [commerceConfig.currency],
    locked: commerceConfig.flowCheckout.enabled,
    lockedHelp:
      "La moneda sigue la configuración comercial porque el pago online activo procesa pedidos en esa moneda.",
  },
} as const;
