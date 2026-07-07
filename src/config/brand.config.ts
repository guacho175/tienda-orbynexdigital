/**
 * Brand configuration.
 * Cambia estos valores para adaptar el template a otro cliente.
 */
export const brandConfig = {
  name: "Orbynex Digital",
  shortName: "Orbynex",
  tagline: "Menos tareas manuales. Mas procesos inteligentes.",
  description:
    "Sitios web, automatizacion y soluciones digitales para negocios que necesitan avanzar.",
  email: "orbynex.digital@gmail.com",
  phone: "+56 9 5788 5679",
  whatsapp: "+56957885679", // Formato E.164 sin espacios ni +
  instagram: "@orbynex.digital",
  instagramUrl: "https://instagram.com/orbynex.digital",
  country: "Chile",
  locale: "es-CL",
  currency: "CLP",
  logoText: "Orbynex", // Texto usado como logo si no hay imagen
  logoUrl: "/logo/logo_orbynex_horizontal_blanco_v2_trim.png",
};

export type BrandConfig = typeof brandConfig;
