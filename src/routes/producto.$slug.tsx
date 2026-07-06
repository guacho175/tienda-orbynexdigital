import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, ShoppingCart, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui-common/Price";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductBySlug } from "@/services/products.service";
import { useCart } from "@/store/cart.store";
import { toast } from "sonner";

export const Route = createFileRoute("/producto/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-8 w-40" />
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Producto no encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          El producto que buscas no existe o ya no está disponible.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/catalogo">Volver al catálogo</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="card-surface aspect-[4/3] overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <Package className="h-24 w-24" />
            </div>
          )}
        </div>

        <div>
          {product.category ? (
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {product.category}
            </span>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          {product.short_description ? (
            <p className="mt-3 text-lg text-muted-foreground">{product.short_description}</p>
          ) : null}
          <Price value={Number(product.price)} currency={product.currency} className="mt-6 block text-3xl" />

          {product.description ? (
            <div className="mt-8 border-t border-border/50 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </h2>
              <p className="mt-3 whitespace-pre-line text-foreground/90">{product.description}</p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="btn-hero"
              onClick={() => {
                addItem(product, 1);
                toast.success("Agregado al carrito", { description: product.name });
              }}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              Agregar al carrito
            </Button>
            {product.payment_url ? (
              <Button asChild variant="outline" size="lg">
                <a href={product.payment_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  {product.payment_button_label ?? "Pagar ahora"}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Container>
  );
}

// silence unused import
void notFound;