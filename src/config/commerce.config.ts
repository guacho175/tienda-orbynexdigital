import { brandConfig } from "./brand.config";

export const commerceConfig = {
  currency: brandConfig.currency,
  locale: brandConfig.locale,
  enableCart: true,
  enableExternalPaymentLinks: true,
  enableWhatsappCheckout: true,
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
      "Al comprar aceptas nuestros términos. Las compras son coordinadas directamente vía WhatsApp o el link de pago del producto.",
  },
};

export type CommerceConfig = typeof commerceConfig;