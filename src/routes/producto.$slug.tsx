import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/BackLink";
import { Price } from "@/components/ui-common/Price";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductBySlug } from "@/services/products.service";
import { useCart } from "@/store/cart.store";
import { buildWhatsappContactUrl } from "@/utils/whatsapp";
import {
  TEMPORARILY_RESERVED_MESSAGE,
  canPurchase,
  getAvailableQuantity,
  isLowStock,
  isSoldOut,
  isTemporarilyReserved,
} from "@/utils/inventory";
import { toast } from "sonner";

export const Route = createFileRoute("/producto/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { addItem, openDrawer } = useCart();
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-10 w-44 rounded-full" />
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-[1.5rem]" />
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
        <Button asChild className="mt-6 rounded-full" variant="outline">
          <Link to="/catalogo">Volver al catalogo</Link>
        </Button>
      </Container>
    );
  }

  const soldOut = isSoldOut(product);
  const lowStock = isLowStock(product);
  const temporarilyReserved = isTemporarilyReserved(product);
  const purchaseAvailable = canPurchase(product);
  const availableQuantity = getAvailableQuantity(product);

  return (
    <Container className="py-8 sm:py-12">
      <BackLink to="/catalogo" label="Volver al catalogo" />

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div data-interactive-card data-card-tilt="true" className="card-surface aspect-[4/3]">
          <div className="card-glow" aria-hidden="true" />
          <ProductImage
            src={product.image_url}
            thumbSrc={product.image_url_thumb}
            cardSrc={product.image_url_card}
            detailSrc={product.image_url_detail}
            alt={`Imagen de ${product.name}`}
            variant="detail"
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full"
            iconClassName="h-24 w-24"
            loading="eager"
            priority
          />
        </div>

        <div className="flex flex-col text-center md:text-left">
          {product.category ? (
            <span className="mx-auto w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent md:mx-0">
              {product.category}
            </span>
          ) : null}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          {product.short_description ? (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:mx-0">
              {product.short_description}
            </p>
          ) : null}
          <Price
            value={Number(product.price)}
            currency={product.currency}
            className="mt-6 block text-4xl font-bold text-accent"
          />

          {product.track_inventory ? (
            <div
              className={
                soldOut
                  ? "mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  : temporarilyReserved || lowStock
                    ? "mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100"
                    : "mt-5 rounded-lg border border-accent/20 bg-accent/10 p-4 text-sm text-accent"
              }
            >
              {soldOut
                ? "Agotado"
                : temporarilyReserved
                  ? `Reservado temporalmente. ${TEMPORARILY_RESERVED_MESSAGE}`
                  : lowStock
                    ? `Ultimas unidades: ${availableQuantity} disponibles`
                    : `Stock disponible: ${product.stock_quantity}`}
            </div>
          ) : null}

          {product.description ? (
            <div className="mt-8 border-t border-white/8 pt-6 text-left">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Descripcion
              </h2>
              <p className="mt-3 whitespace-pre-line text-foreground/90">{product.description}</p>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              className="btn-hero rounded-full"
              disabled={!purchaseAvailable}
              onClick={() => {
                if (!purchaseAvailable) {
                  toast.error(temporarilyReserved ? "Producto reservado" : "Producto agotado", {
                    description: temporarilyReserved
                      ? TEMPORARILY_RESERVED_MESSAGE
                      : `${product.name} no esta disponible para agregar al carrito.`,
                  });
                  return;
                }
                addItem(product, 1);
                openDrawer();
                toast.success("Agregado al carrito", {
                  description: `${product.name} quedo listo para revisar el pedido.`,
                });
              }}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              {temporarilyReserved ? "Reservado temporalmente" : "Agregar al carrito"}
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/catalogo">Seguir comprando</Link>
            </Button>
          </div>

          {soldOut ? (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-3 w-full rounded-full sm:w-fit"
            >
              <a
                href={buildWhatsappContactUrl(
                  `Hola, quiero consultar por disponibilidad de ${product.name}.`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                Consultar por WhatsApp
              </a>
            </Button>
          ) : null}

          {product.payment_url && purchaseAvailable ? (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-3 w-full rounded-full sm:w-fit"
            >
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
