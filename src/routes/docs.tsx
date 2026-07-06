import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { brandConfig } from "@/config/brand.config";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: `Documentación · ${brandConfig.name}` },
      {
        name: "description",
        content:
          "Guía para reutilizar este template de mini e-commerce: configuración, productos, pagos y despliegue.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border/50 bg-secondary/40 p-4 text-xs text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function DocsPage() {
  const toc: [string, string][] = [
    ["overview", "1. Visión general"],
    ["stack", "2. Stack técnico"],
    ["structure", "3. Estructura del proyecto"],
    ["reuse", "4. Reutilizar para otro cliente"],
    ["config", "5. Archivos de configuración"],
    ["products", "6. Gestión de productos"],
    ["admin", "7. Panel admin y roles"],
    ["payments", "8. Pagos y checkout"],
    ["deploy", "9. Publicación"],
    ["faq", "10. Preguntas frecuentes"],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Docs"
        title="Guía del template"
        subtitle="Cómo funciona esta base de mini e-commerce y cómo reutilizarla para nuevos clientes."
      />
      <Container className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="card-surface p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Contenido</p>
            <ul className="space-y-1 text-sm">
              {toc.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-muted-foreground hover:text-foreground">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="space-y-10">
          <Section id="overview" title="1. Visión general">
            <p>
              Este proyecto es un <strong>template reutilizable</strong> de mini e-commerce (5-20
              productos) construido con TanStack Start y Lovable Cloud. El demo actual está
              configurado para <strong>{brandConfig.name}</strong>, pero la arquitectura permite
              crear tiendas nuevas cambiando principalmente archivos de configuración, productos en
              la base de datos, imágenes, links de pago y colores de marca — sin reescribir la
              aplicación.
            </p>
            <p>Incluye:</p>
            <ul className="list-disc pl-5">
              <li>Storefront público: home, catálogo, ficha de producto, carrito, checkout.</li>
              <li>
                Carrito persistente en <code>localStorage</code>.
              </li>
              <li>Checkout con pago online o link de pago externo por producto.</li>
              <li>
                Panel admin protegido por rol <code>admin</code> con CRUD de productos.
              </li>
              <li>Configuración centralizada de marca, tema, navegación y comercio.</li>
            </ul>
          </Section>

          <Section id="stack" title="2. Stack técnico">
            <ul className="list-disc pl-5">
              <li>TanStack Start v1 + TanStack Router (file-based routing).</li>
              <li>React 19 + Vite 7.</li>
              <li>
                Tailwind CSS v4 con tokens semánticos en <code>src/styles.css</code>.
              </li>
              <li>
                shadcn/ui (componentes en <code>src/components/ui</code>).
              </li>
              <li>TanStack Query para data fetching.</li>
              <li>Lovable Cloud (Supabase) para base de datos y autenticación.</li>
              <li>
                RLS activo con rol <code>admin</code> en tabla <code>user_roles</code>.
              </li>
            </ul>
          </Section>

          <Section id="structure" title="3. Estructura del proyecto">
            <Code>{`src/
├── config/                    # Configuración de marca / tema / comercio
│   ├── app.config.ts
│   ├── brand.config.ts        # Nombre, contacto, redes
│   ├── theme.config.ts        # Colores y tokens
│   ├── commerce.config.ts     # Moneda, carrito y checkout
│   ├── home.config.ts         # Textos del home
│   └── navigation.config.ts   # Links del navbar/footer
├── components/
│   ├── admin/                 # Formulario CRUD productos
│   ├── layout/                # Navbar, Footer, Container, PageHeader
│   ├── product/               # ProductCard
│   ├── ui-common/             # Price, EmptyState
│   └── ui/                    # shadcn/ui
├── routes/
│   ├── __root.tsx             # Providers + layout global
│   ├── index.tsx              # Home
│   ├── catalogo.tsx
│   ├── producto.$slug.tsx
│   ├── carrito.tsx
│   ├── checkout.tsx
│   ├── docs.tsx               # Esta página
│   ├── auth.tsx               # Login/registro admin
│   └── _authenticated/
│       ├── route.tsx          # Guard de sesión (managed)
│       ├── admin.index.tsx    # Lista de productos
│       ├── admin.new.tsx      # Crear producto
│       └── admin.edit.$id.tsx # Editar producto
├── services/products.service.ts
├── store/cart.store.tsx
├── types/                     # Tipos Product, CartItem
└── utils/                     # currency y utilidades comerciales`}</Code>
          </Section>

          <Section id="reuse" title="4. Reutilizar para otro cliente">
            <p>Para clonar este template y adaptarlo a otro cliente sigue estos pasos:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <strong>Duplicar el proyecto</strong> desde Lovable (nueva instancia con su propio
                Lovable Cloud / base de datos).
              </li>
              <li>
                <strong>
                  Editar <code>src/config/brand.config.ts</code>
                </strong>
                : nombre, tagline, email, teléfono, Instagram, moneda y locale.
              </li>
              <li>
                <strong>
                  Editar <code>src/config/theme.config.ts</code>
                </strong>{" "}
                y<code> src/styles.css</code> para cambiar la paleta (tokens en <code>:root</code>).
              </li>
              <li>
                <strong>
                  Editar <code>src/config/home.config.ts</code>
                </strong>{" "}
                con los textos del hero, beneficios y CTA.
              </li>
              <li>
                <strong>
                  Editar <code>src/config/navigation.config.ts</code>
                </strong>{" "}
                con los links del navbar y footer.
              </li>
              <li>
                <strong>Cargar productos</strong> desde <code>/admin</code> (ver sección 7).
              </li>
              <li>
                <strong>Configurar links de pago</strong> por producto (Flow, Mercado Pago, Stripe
                Payment Links, etc.) o dejar solo pago online.
              </li>
              <li>
                <strong>Publicar</strong> desde Lovable (ver sección 9).
              </li>
            </ol>
            <p>
              Ningún paso anterior requiere tocar rutas, componentes o servicios: todo el contenido
              específico del cliente vive en <code>src/config/</code> y en la base.
            </p>
          </Section>

          <Section id="config" title="5. Archivos de configuración">
            <p>
              <strong>
                <code>brand.config.ts</code>
              </strong>{" "}
              — Identidad del cliente.
            </p>
            <Code>{`export const brandConfig = {
  name: "Orbynex Digital",
  tagline: "...",
  email: "hola@ejemplo.com",
  currency: "CLP",
  locale: "es-CL",
  // ...
};`}</Code>
            <p>
              <strong>
                <code>commerce.config.ts</code>
              </strong>{" "}
              — Comportamiento del carrito y checkout: activar/desactivar carrito, pago online y
              links de pago externo.
            </p>
            <p>
              <strong>
                <code>theme.config.ts</code>
              </strong>{" "}
              y <code>styles.css</code> — Colores como tokens HSL en <code>:root</code>. Nunca uses{" "}
              <code>text-white</code> o hex directo en componentes.
            </p>
            <p>
              <strong>
                <code>home.config.ts</code>
              </strong>{" "}
              — Textos del hero, features, CTA.
            </p>
            <p>
              <strong>
                <code>navigation.config.ts</code>
              </strong>{" "}
              — Enlaces del navbar y footer.
            </p>
          </Section>

          <Section id="products" title="6. Gestión de productos">
            <p>
              Los productos viven en la tabla <code>products</code>. Campos principales:
            </p>
            <ul className="list-disc pl-5">
              <li>
                <code>name</code>, <code>slug</code> (único, minúsculas y guiones).
              </li>
              <li>
                <code>short_description</code>, <code>description</code>.
              </li>
              <li>
                <code>price</code>, <code>currency</code>.
              </li>
              <li>
                <code>category</code>, <code>image_url</code>.
              </li>
              <li>
                <code>is_active</code> (visible en tienda), <code>display_order</code>.
              </li>
              <li>
                <code>availability</code>: <code>in_stock</code>, <code>out_of_stock</code>,{" "}
                <code>on_demand</code>.
              </li>
              <li>
                <code>payment_url</code>, <code>payment_button_label</code> (opcional).
              </li>
            </ul>
            <p>
              RLS: el público solo lee productos con <code>is_active = true</code>. Solo usuarios
              con rol <code>admin</code> pueden crear, editar o eliminar.
            </p>
          </Section>

          <Section id="admin" title="7. Panel admin y roles">
            <p>Pasos para crear el primer administrador:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Ir a <code>/auth</code> y registrar la cuenta del cliente.
              </li>
              <li>
                Asignar el rol <code>admin</code> insertando una fila en <code>user_roles</code>
                con el <code>user_id</code> del usuario y <code>role = 'admin'</code>.
              </li>
              <li>
                Iniciar sesión y acceder a <code>/admin</code>.
              </li>
            </ol>
            <p>
              Desde <code>/admin</code>: crear productos, editarlos, activar/desactivar con el
              switch y eliminar (con confirmación).
            </p>
            <p>
              <strong>Seguridad:</strong> los roles se guardan en la tabla separada
              <code> user_roles</code> y se verifican con la función <code>has_role()</code> en
              todas las policies. Nunca se guardan roles en el cliente ni en el perfil.
            </p>
          </Section>

          <Section id="payments" title="8. Pagos y checkout">
            <p>El proyecto soporta dos vías de pago, no excluyentes:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <strong>Pago online</strong>: procesa el carrito completo y redirige al proveedor
                configurado para completar la compra.
              </li>
              <li>
                <strong>Link de pago externo por producto</strong>: si el producto tiene
                <code> payment_url</code>, se muestra un botón que redirige a Flow, Mercado Pago,
                Stripe Payment Link, etc.
              </li>
            </ol>
            <p>
              No hay integración de tarjetas en el propio sitio. Esto mantiene el template simple y
              sin dependencia de credenciales de pasarelas por proyecto.
            </p>
          </Section>

          <Section id="deploy" title="9. Publicación">
            <p>
              Desde el editor de Lovable, publica con el botón "Publish". El sitio queda en una URL{" "}
              <code>*.lovable.app</code>. Para dominio propio, conéctalo desde la configuración del
              proyecto.
            </p>
            <p>
              Antes de publicar, verifica: productos activos correctos, textos del home, teléfono de
              contacto, y que el primer admin exista en la base.
            </p>
          </Section>

          <Section id="faq" title="10. Preguntas frecuentes">
            <p>
              <strong>¿Puedo cambiar los colores sin tocar componentes?</strong>
            </p>
            <p>
              Sí. Edita los tokens HSL en <code>src/styles.css</code>. Los componentes ya usan{" "}
              <code>bg-primary</code>, <code>text-foreground</code>, etc.
            </p>
            <p>
              <strong>¿Se puede desactivar el carrito?</strong>
            </p>
            <p>
              Sí. Cambia <code>commerceConfig.enableCart = false</code>. Los botones desaparecen y
              el checkout queda por link de pago del producto.
            </p>
            <p>
              <strong>¿Cómo agrego un nuevo campo al producto?</strong>
            </p>
            <p>
              1) Crea la migración en la base. 2) Añade el campo en{" "}
              <code>src/types/product.ts</code>. 3) Añade el input en <code>ProductForm.tsx</code>.
              4) Renderiza donde lo necesites.
            </p>
            <p>
              <strong>¿Cómo agrego más admins?</strong>
            </p>
            <p>
              Cada nuevo usuario se registra en <code>/auth</code>. Luego inserta una fila en{" "}
              <code>user_roles</code> con su <code>user_id</code> y <code>role = 'admin'</code>.
            </p>
          </Section>
        </div>
      </Container>
    </>
  );
}
