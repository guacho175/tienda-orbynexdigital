export const navigationConfig = {
  primary: [
    { label: "Inicio", href: "/" },
    { label: "Productos", href: "/catalogo" },
    { label: "Carrito", href: "/carrito" },
  ],
  footer: {
    links: [
      { label: "Inicio", href: "/" },
      { label: "Catalogo", href: "/catalogo" },
      { label: "Carrito", href: "/carrito" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
};

export type NavigationConfig = typeof navigationConfig;
