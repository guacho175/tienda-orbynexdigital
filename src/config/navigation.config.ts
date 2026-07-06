export const navigationConfig = {
  primary: [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
  ],
  footer: {
    links: [
      { label: "Inicio", href: "/" },
      { label: "Catálogo", href: "/catalogo" },
      { label: "Carrito", href: "/carrito" },
    ],
  },
};

export type NavigationConfig = typeof navigationConfig;