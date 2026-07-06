/**
 * Brand configuration.
 * Cambia estos valores para adaptar el template a otro cliente.
 */
export const brandConfig = {
  name: "Orbynex Digital",
  shortName: "Orbynex",
  tagline: "Menos tareas manuales. Más procesos inteligentes.",
  description:
    "Sitios web, automatización y soluciones digitales para negocios que necesitan avanzar.",
  email: "orbynex.digital@gmail.com",
  phone: "+56 9 5788 5679",
  whatsapp: "+56957885679", // Formato E.164 sin espacios ni +
  instagram: "@orbynex.digital",
  instagramUrl: "https://instagram.com/orbynex.digital",
  country: "Chile",
  locale: "es-CL",
  currency: "CLP",
  logoText: "Orbynex", // Texto usado como logo si no hay imagen
  logoUrl: null as string | null,
};

export type BrandConfig = typeof brandConfig;