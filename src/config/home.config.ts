import { brandConfig } from "./brand.config";

export const homeConfig = {
  hero: {
    eyebrow: "Demo e-commerce funcional",
    title: "Tienda demo con catalogo, carrito y pagos online",
    subtitle:
      "Explora productos, agregalos al carrito y prueba un flujo de compra con checkout, WhatsApp y pago online.",
    primaryCta: { label: "Ver productos", href: "/catalogo" },
    secondaryCta: { label: "Probar carrito", href: "/carrito" },
  },
  categoriesFallback: [
    "Sitios web",
    "E-commerce",
    "Automatizacion",
    "Soporte",
    "Plantillas",
    "Servicios digitales",
  ],
  storeHighlights: [
    {
      title: "Catalogo administrable",
      description: "Productos activos, imagenes, categorias, precios y orden de aparicion.",
    },
    {
      title: "Carrito persistente",
      description: "El pedido se mantiene en el navegador mientras el usuario explora la tienda.",
    },
    {
      title: "Checkout flexible",
      description: "Flow API, WhatsApp y links externos por producto sin bloquear la compra.",
    },
  ],
  howItWorks: [
    {
      step: "1",
      title: "Explora el catalogo",
      description: "Revisa productos, categorias, precios y detalle antes de comprar.",
    },
    {
      step: "2",
      title: "Agrega al carrito",
      description: "Combina productos y ajusta cantidades desde una vista clara.",
    },
    {
      step: "3",
      title: "Finaliza la compra",
      description: "Paga con Flow o envia el pedido por WhatsApp si prefieres contacto directo.",
    },
    {
      step: "4",
      title: "Recibe confirmacion",
      description: "El resultado de pago muestra el estado de la orden y las acciones disponibles.",
    },
  ],
  demoSection: {
    eyebrow: `Desarrollado por ${brandConfig.name}`,
    title: "Un mini-commerce listo para adaptar a distintos rubros",
    description:
      "Este demo muestra una tienda online con catalogo editable, productos con imagenes, carrito de compra, checkout, pagos integrables y despliegue en Vercel con backend Supabase.",
    items: [
      "Catalogo administrable",
      "Productos con imagenes",
      "Carrito persistente",
      "Checkout con Flow API",
      "WhatsApp como alternativa",
      "payment_url como fallback",
      "Admin de productos",
      "Backend Supabase",
    ],
    cta: { label: "Ver catalogo completo", href: "/catalogo" },
    secondaryCta: { label: "Ir al checkout", href: "/checkout" },
  },
  featuredProducts: {
    eyebrow: "Productos destacados",
    title: "Compra servicios digitales desde una tienda online real",
    subtitle: "Productos reales cargados desde Supabase y ordenados por prioridad comercial.",
    limit: 6,
    cta: { label: "Ver catalogo completo", href: "/catalogo" },
  },
  categories: {
    eyebrow: "Categorias",
    title: "Que puedes vender con esta tienda",
    subtitle: "La portada permite entender rapidamente la oferta sin obligar a entrar al catalogo.",
  },
  finalCta: {
    title: "Prueba el flujo completo de compra",
    subtitle:
      "Agrega productos al carrito y revisa como se ve el checkout antes de adaptar la tienda a un cliente real.",
    primaryCta: { label: "Ver productos", href: "/catalogo" },
    secondaryCta: { label: "Abrir carrito", href: "/carrito" },
  },
};

export type HomeConfig = typeof homeConfig;
