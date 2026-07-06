import { brandConfig } from "./brand.config";

export const homeConfig = {
  hero: {
    eyebrow: "Tienda online para servicios digitales",
    title: "Vende servicios y productos digitales con una tienda clara, simple y profesional",
    subtitle:
      "Publica tu catalogo, recibe pedidos claros y permite pagos online desde una experiencia pensada para clientes reales.",
    primaryCta: { label: "Ver servicios", href: "/catalogo" },
    secondaryCta: { label: "Ver como comprar", href: "#como-comprar" },
  },
  categoriesFallback: [
    "Sitios web",
    "Tiendas online",
    "Automatizacion",
    "Soporte digital",
    "Consultoria",
    "Servicios digitales",
  ],
  storeHighlights: [
    {
      title: "Catalogo listo para vender",
      description: "Servicios con imagenes, precios, categorias y detalles faciles de revisar.",
    },
    {
      title: "Pedidos sin friccion",
      description:
        "El cliente agrega servicios, revisa el total y avanza al pago o al contacto directo.",
    },
    {
      title: "Gestion comercial simple",
      description:
        "Administra productos y mantiene una vitrina ordenada sin depender de tareas manuales.",
    },
  ],
  howItWorks: [
    {
      step: "1",
      title: "El cliente elige",
      description: "Revisa categorias, precios y detalles de cada servicio antes de avanzar.",
    },
    {
      step: "2",
      title: "Arma su pedido",
      description: "Combina servicios, ajusta cantidades y ve el total con claridad.",
    },
    {
      step: "3",
      title: "Finaliza la compra",
      description:
        "Paga online o solicita contacto si necesita coordinar detalles antes de avanzar.",
    },
    {
      step: "4",
      title: "Recibe confirmacion",
      description: "El pedido queda claro para el cliente y para el equipo que debe atenderlo.",
    },
  ],
  demoSection: {
    eyebrow: `Desarrollado por ${brandConfig.name}`,
    title: "Una vitrina comercial lista para publicar servicios",
    description:
      "Ideal para negocios que venden paquetes digitales, asesorias, sitios web, automatizaciones o soporte y necesitan recibir pedidos sin explicar el proceso por mensajes.",
    items: [
      "Catalogo editable",
      "Productos con imagenes optimizadas",
      "Carrito de compra claro",
      "Pago online disponible",
      "Pedidos claros para atender",
      "Categorias faciles de explorar",
      "Panel de productos",
      "Experiencia responsive",
    ],
    cta: { label: "Explorar tienda", href: "/catalogo" },
    secondaryCta: { label: "Ver como comprar", href: "/checkout" },
  },
  featuredProducts: {
    eyebrow: "Servicios destacados",
    title: "Servicios digitales listos para comprar online",
    subtitle: "Una grilla pensada para comparar, elegir y avanzar sin friccion.",
    limit: 6,
    cta: { label: "Ver catalogo completo", href: "/catalogo" },
  },
  categories: {
    eyebrow: "Categorias de servicio",
    title: "Soluciones que puedes publicar en tu tienda",
    subtitle: "Agrupa tu oferta para que cada cliente encuentre rapido lo que necesita contratar.",
  },
  finalCta: {
    title: "Convierte tu catalogo en una tienda que vende",
    subtitle:
      "Publica servicios, muestra precios y recibe pedidos desde una experiencia profesional de principio a fin.",
    primaryCta: { label: "Ver servicios", href: "/catalogo" },
    secondaryCta: { label: "Ver catalogo completo", href: "/catalogo" },
  },
};

export type HomeConfig = typeof homeConfig;
