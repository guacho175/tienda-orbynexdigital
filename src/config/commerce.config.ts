import { brandConfig } from "./brand.config";

export const commerceConfig = {
  currency: brandConfig.currency,
  locale: brandConfig.locale,
  enableCart: true,
  enableExternalPaymentLinks: true,
  enableWhatsappCheckout: true,
  flowCheckout: {
    enabled: true,
    label: "Pagar online",
  },
  // Namespace usado en localStorage para el carrito. Cambia el prefijo al
  // reutilizar el template para otro cliente si quieres aislar el carrito.
  cartStorageKey: "shop_cart_v1",
  whatsappCheckout: {
    enabled: true,
    phone: brandConfig.whatsapp,
    defaultMessage: "Hola, quiero realizar este pedido:",
  },
  externalPayments: {
    enabled: true,
    providers: ["flow", "mercado_pago", "custom"] as const,
  },
  relatedProducts: {
    enabled: true,
    limit: 3,
    sameCategoryFirst: true,
    fallbackAcrossCategories: true,
    staleTimeMs: 5 * 60 * 1000,
    gcTimeMs: 30 * 60 * 1000,
    eyebrow: "Relacionados",
    title: "Productos similares",
    previousLabel: "Ver productos anteriores",
    nextLabel: "Ver mas productos",
  },
  legal: {
    termsShort:
      "Al comprar aceptas nuestros terminos. Las compras se procesan por pago online o el link de pago disponible.",
  },
};

export type CommerceConfig = typeof commerceConfig;
