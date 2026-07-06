import { brandConfig } from "./brand.config";

export const homeConfig = {
  hero: {
    eyebrow: brandConfig.name,
    title: "Servicios digitales simples, claros y escalables",
    subtitle: brandConfig.description,
    primaryCta: { label: "Ver servicios", href: "/catalogo" },
    secondaryCta: { label: "Contactar por WhatsApp", href: "whatsapp" },
  },
  benefits: [
    { title: "Implementación clara", description: "Procesos ordenados y pensados para escalar sin fricción." },
    { title: "Diseño moderno", description: "Interfaces limpias, responsive y con identidad propia." },
    { title: "Automatización real", description: "Menos tareas manuales, más tiempo para hacer crecer tu negocio." },
  ],
  howItWorks: [
    { step: "1", title: "Elige un servicio", description: "Explora el catálogo y encuentra el que más se adapta a ti." },
    { step: "2", title: "Coordinamos por WhatsApp", description: "Definimos alcance, tiempos y confirmamos el pago." },
    { step: "3", title: "Entregamos y acompañamos", description: "Implementación, entrega y soporte inicial." },
  ],
  finalCta: {
    title: "¿Listo para avanzar?",
    subtitle: "Conversemos sobre tu proyecto y encontremos la solución justa.",
    ctaLabel: "Hablar por WhatsApp",
  },
};

export type HomeConfig = typeof homeConfig;