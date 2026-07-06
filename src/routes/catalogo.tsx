import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActiveProducts } from "@/services/products.service";
import { Package } from "lucide-react";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — Orbynex Digital" },
      {
        name: "description",
        content: "Servicios digitales: sitios web, automatización y soporte técnico.",
      },
    ],
  }),
  component: CatalogoPage,
});

function CatalogoPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products", "active"],
    queryFn: fetchActiveProducts,
  });

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Nuestros servicios"
        subtitle="Elige el que mejor se ajusta a tu proyecto. Coordinamos todo por WhatsApp."
      />
      <Container className="py-12">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="No pudimos cargar el catálogo"
            description="Intenta recargar la página en unos segundos."
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="Aún no hay productos"
            description="Muy pronto publicaremos servicios en esta sección."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}