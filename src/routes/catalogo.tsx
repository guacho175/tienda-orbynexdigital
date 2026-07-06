import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/BackLink";
import { fetchCatalogProducts, PRODUCTS_STALE_TIME_MS } from "@/services/products.service";
import { brandConfig } from "@/config/brand.config";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: `Catalogo de productos - ${brandConfig.name}` },
      {
        name: "description",
        content: "Catalogo de servicios digitales con carrito, pago online y WhatsApp.",
      },
    ],
  }),
  component: CatalogoPage,
});

function CatalogoPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const { data, isLoading, error } = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: fetchCatalogProducts,
    staleTime: PRODUCTS_STALE_TIME_MS,
  });

  const categories = useMemo(() => {
    const unique = Array.from(new Set((data ?? []).map((p) => p.category).filter(Boolean)));
    return ["Todos", ...(unique as string[])];
  }, [data]);

  const filteredProducts =
    selectedCategory === "Todos"
      ? (data ?? [])
      : (data ?? []).filter((product) => product.category === selectedCategory);

  return (
    <>
      <PageHeader
        eyebrow="Catalogo"
        title="Catalogo de servicios"
        subtitle="Explora servicios digitales, revisa detalles y agrega al carrito para avanzar con tu pedido."
      />
      <Container className="py-8 sm:py-12">
        <BackLink to="/" label="Inicio" />

        {!isLoading && !error && data && data.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "rounded-full border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent transition-colors"
                    : "rounded-full border border-border/60 bg-background/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                }
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[430px] w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="No pudimos cargar el catalogo"
              description="Intenta recargar la pagina en unos segundos."
              action={
                <Button asChild variant="outline">
                  <Link to="/">Volver al inicio</Link>
                </Button>
              }
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="Aun no hay productos"
              description="Cuando publiques productos activos desde el panel apareceran en esta grilla."
              action={
                <Button asChild className="btn-hero">
                  <Link to="/">Volver al inicio</Link>
                </Button>
              }
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="No hay productos en esta categoria"
              description="Prueba otra categoria o vuelve a ver todo el catalogo."
              action={
                <Button onClick={() => setSelectedCategory("Todos")} variant="outline">
                  Ver todos
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
