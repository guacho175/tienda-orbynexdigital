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
  legal: {
    termsShort:
      "Al comprar aceptas nuestros terminos. Las compras se procesan por pago online, WhatsApp o el link de pago disponible.",
  },
};

export type CommerceConfig = typeof commerceConfig;
