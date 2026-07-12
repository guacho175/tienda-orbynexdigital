import { commerceConfig } from "./commerce.config";

export const PRODUCT_EDITOR_LIMITS = {
  name: 120,
  slug: 120,
  short_description: 200,
  description: 4000,
  meta_title: 70,
  meta_description: 170,
  category: 60,
  og_image_url: 500,
  payment_button_label: 60,
} as const;

export const PRODUCT_EDITOR_SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Informacion principal que vera el cliente.",
  },
  {
    id: "inventory",
    label: "Inventario",
    description: "Disponibilidad, stock registrado y reglas de compra.",
  },
  {
    id: "stockMovements",
    label: "Movimientos de stock",
    description: "Entradas, ventas externas, correcciones e historial.",
    existingProductOnly: true,
  },
  {
    id: "pricing",
    label: "Precios y pago",
    description: "Precio, moneda y pago externo opcional.",
  },
  {
    id: "media",
    label: "Multimedia",
    description: "Imagen principal y variantes optimizadas.",
  },
  {
    id: "organization",
    label: "Organizacion",
    description: "Categoria, orden y visibilidad del producto.",
  },
  {
    id: "seo",
    label: "Direccion publica",
    description: "Enlace y vista en buscadores.",
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
  payment_external_enabled: "pricing",
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
  meta_title: "seo",
  meta_description: "seo",
  seo_noindex: "seo",
  og_image_url: "seo",
} as const satisfies Record<string, ProductEditorSectionId>;

export const PRODUCT_AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "Disponible" },
  { value: "out_of_stock", label: "Agotado manualmente" },
  { value: "on_demand", label: "Bajo pedido" },
] as const;

export const PRODUCT_OUT_OF_STOCK_OPTIONS = [
  { value: "show_sold_out", label: "Mantener visible como agotado" },
  { value: "hide_product", label: "Ocultar del catalogo" },
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
  copy: {
    pricing: {
      sectionDescription:
        "Configura el valor publicado y decide si este producto tendra un enlace de pago externo.",
      externalPayment: {
        title: "Pago alternativo",
        toggleLabel: "Usar enlace de pago externo",
        toggleHelp:
          "Activalo solo si este producto se puede pagar con un link fuera del checkout normal.",
        warningTitle: "Importante antes de activarlo",
        warningDescription:
          "Este enlace se ofrece para comprar este producto de forma individual. Si el cliente tiene varios articulos en el carrito, debera usar el pago online normal.",
        urlLabel: "URL de pago externo",
        urlHelp: "Pega el enlace completo que recibira el cliente al elegir este pago.",
        buttonLabel: "Texto del boton de pago",
        buttonHelp: "Si queda vacio, se usara el texto por defecto del checkout externo.",
      },
    },
    inventory: {
      sectionDescription:
        "Define si el producto se puede comprar y como se descuentan sus unidades.",
      resultTitle: "Resultado en la tienda",
      resultHelp:
        "Este resumen muestra lo que vera o podra hacer el cliente segun la configuracion actual.",
      availabilityLabel: "Estado de venta",
      availabilityHelp:
        "Indica si el producto se vende normalmente, queda agotado o se trabaja bajo pedido.",
      trackInventoryLabel: "Contar unidades disponibles",
      trackInventoryHelp:
        "Activalo si vendes unidades limitadas. Desactivalo para servicios, asesorias o productos sin limite.",
      registeredStockLabel: "Stock registrado",
      registeredStockHelp:
        "Para sumar, rebajar o corregir unidades usa Movimientos de stock. Asi queda historial de cada ajuste.",
      stockMovementsButton: "Ir a Movimientos de stock",
      initialStockLabel: "Stock inicial",
      initialStockHelp: "Define cuantas unidades quedan disponibles al crear el producto.",
      lowStockThresholdLabel: "Aviso de pocas unidades",
      lowStockThresholdHelp:
        "Cuando el stock llegue a este numero, el panel lo marcara como pocas unidades.",
      allowBackorderLabel: "Permitir venta sin stock",
      allowBackorderHelp:
        "Permite que el cliente compre aunque el stock este en cero. Usalo solo si puedes reponer o entregar bajo pedido.",
      outOfStockBehaviorLabel: "Cuando no haya stock",
      outOfStockBehaviorHelp:
        "Elige si el producto seguira visible como agotado o si desaparecera del catalogo.",
      backorderOverridesVisibility:
        "Esta regla no se aplica mientras la venta sin stock este permitida.",
      untrackedResult:
        "Este producto seguira disponible sin descontar unidades. Recomendado para servicios o productos sin limite.",
      status: {
        manuallySoldOut: {
          label: "Agotado manualmente",
          description: "El producto no se podra comprar aunque tenga unidades registradas.",
        },
        untracked: {
          label: "Disponible sin descontar unidades",
          description: "El cliente podra comprarlo y el sistema no rebajara stock.",
        },
        backorder: {
          label: "Venta sin stock permitida",
          description: "El cliente podra comprarlo aunque el stock registrado llegue a cero.",
        },
        soldOutHidden: {
          label: "Agotado y oculto",
          description: "Cuando no haya unidades, el producto desaparecera del catalogo.",
        },
        soldOutVisible: {
          label: "Agotado visible",
          description: "Cuando no haya unidades, el producto seguira visible como agotado.",
        },
        lowStock: {
          label: "Pocas unidades",
          description: "El producto se puede comprar, pero el panel lo marcara como stock bajo.",
        },
        available: {
          label: "Disponible",
          description: "El cliente podra comprarlo normalmente.",
        },
      },
    },
    seo: {
      title: "Direccion publica y vista en buscadores",
      sectionDescription:
        "Define el enlace del producto y como se vera cuando aparezca en buscadores o redes.",
      slugLabel: "Direccion del producto",
      slugHelp:
        "Es la parte final del enlace publico. Usa una direccion breve y facil de reconocer.",
      metaTitleLabel: "Titulo para Google y redes",
      metaTitleHelp: "Si queda vacio, se usara el nombre del producto automaticamente.",
      ogImageLabel: "Imagen para compartir en redes",
      ogImageHelp:
        "Si queda vacia, se usara la imagen de detalle, tarjeta o imagen general de la tienda.",
      metaDescriptionLabel: "Descripcion para Google y redes",
      metaDescriptionHelp:
        "Si queda vacia, se usara la descripcion corta o la descripcion completa del producto.",
      noIndexLabel: "Ocultar de buscadores",
      noIndexHelp:
        "El producto seguira visible en la tienda, pero se pedira a buscadores que no lo muestren en resultados.",
      previewLabel: "Vista previa",
      previewHelp: "Simula el titulo, enlace y descripcion que se publicaran.",
    },
    validation: {
      slugRequired: "La direccion del producto es obligatoria",
      slugPattern: "Usa solo minusculas, numeros y guiones",
    },
  },
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
      label: "Envio",
      enabled: false,
      visible: false,
      reason: "No existe modelo de peso, dimensiones, metodos ni calculo server-side de envio.",
    },
    {
      id: "gallery",
      label: "Galeria",
      enabled: false,
      visible: false,
      reason:
        "El producto solo tiene una imagen principal y variantes tecnicas generadas por upload.",
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
      "La moneda sigue la configuracion comercial porque el pago online activo procesa pedidos en esa moneda.",
  },
} as const;
