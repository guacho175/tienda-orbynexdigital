import { commerceConfig } from "./commerce.config";

export const PRODUCT_EDITOR_LIMITS = {
  name: 120,
  slug: 120,
  short_description: 200,
  description: 4000,
  category: 60,
  payment_button_label: 60,
} as const;

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

export type ProductEditorFutureCapabilityId =
  "shipping" | "gallery" | "advancedPricing" | "advancedVisibility";

export interface ProductEditorFutureCapability {
  id: ProductEditorFutureCapabilityId;
  label: string;
  enabled: boolean;
  visible: boolean;
  reason: string;
}

export const productEditorConfig = {
  sections: PRODUCT_EDITOR_SECTIONS,
  characterLimits: PRODUCT_EDITOR_LIMITS,
  featureFlags: {
    seoPreview: true,
    shipping: false,
    gallery: false,
    advancedPricing: false,
    advancedVisibility: false,
  },
  futureCapabilities: [
    {
      id: "shipping",
      label: "Envío",
      enabled: false,
      visible: false,
      reason: "No existe modelo de peso, dimensiones, métodos ni cálculo server-side de envío.",
    },
    {
      id: "gallery",
      label: "Galería",
      enabled: false,
      visible: false,
      reason:
        "El producto solo tiene una imagen principal y variantes técnicas generadas por upload.",
    },
    {
      id: "advancedPricing",
      label: "Precios avanzados",
      enabled: false,
      visible: false,
      reason:
        "Descuentos, impuestos y precio final requieren autoridad server-side antes de exponer UI.",
    },
    {
      id: "advancedVisibility",
      label: "Visibilidad avanzada",
      enabled: false,
      visible: false,
      reason:
        "Estados adicionales como borrador, privado o destacado no existen en el contrato actual.",
    },
  ] satisfies ProductEditorFutureCapability[],
  currency: {
    options: [commerceConfig.currency],
    locked: commerceConfig.flowCheckout.enabled,
    lockedHelp:
      "La moneda sigue la configuración comercial porque el pago online activo procesa pedidos en esa moneda.",
  },
} as const;
