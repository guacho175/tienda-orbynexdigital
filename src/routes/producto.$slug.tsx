import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/BackLink";
import { Price } from "@/components/ui-common/Price";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/product/ProductImage";
import { fetchProductBySlug } from "@/services/products.service";
import { useCart } from "@/store/cart.store";
import { toast } from "sonner";

export const Route = createFileRoute("/producto/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  if (isLoading) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-10 w-44 rounded-full" />
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-24 rounded-full" />
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
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          El producto que buscas no existe o ya no esta disponible en el catalogo publico.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/catalogo">Volver al catalogo</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <BackLink to="/catalogo" label="Volver al catalogo" />

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <ProductImage
          src={product.image_url}
          alt={`Imagen de ${product.name}`}
          className="card-surface aspect-[4/3]"
          iconClassName="h-24 w-24"
          loading="eager"
        />

        <div className="flex flex-col">
          {product.category ? (
            <span className="w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              {product.category}
            </span>
          ) : null}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          {product.short_description ? (
            <p className="mt-4 text-lg text-muted-foreground">{product.short_description}</p>
          ) : null}
          <Price
            value={Number(product.price)}
            currency={product.currency}
            className="mt-6 block text-4xl font-bold text-accent"
          />

          {product.description ? (
            <div className="mt-8 border-t border-border/50 pt-6">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Descripcion</h2>
              <p className="mt-3 whitespace-pre-line text-foreground/90">{product.description}</p>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
            <Button asChild variant="outline" size="lg">
              <Link to="/catalogo">Seguir comprando</Link>
            </Button>
          </div>

          {product.payment_url ? (
            <Button asChild variant="outline" size="lg" className="mt-3 w-full sm:w-fit">
              <a href={product.payment_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" />
                {product.payment_button_label ?? "Pagar con link externo"}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
