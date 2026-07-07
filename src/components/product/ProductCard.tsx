import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui-common/Price";
import { useCart } from "@/store/cart.store";
import type { ProductCardData } from "@/types/product";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();

  return (
    <article
      data-interactive-card
      data-card-tilt="true"
      className="card-surface group flex h-full flex-col overflow-hidden transition duration-200"
    >
      <div className="card-glow" aria-hidden="true" />
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/30">
        <ProductImage
          src={product.image_url}
          thumbSrc={product.image_url_thumb}
          cardSrc={product.image_url_card}
          detailSrc={product.image_url_detail}
          alt={`Imagen de ${product.name}`}
          variant="card"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
          className="h-full w-full"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
        />
        {product.category ? (
          <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            {product.category}
          </span>
        ) : null}
        <span className="absolute bottom-3 right-3 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
          Disponible online
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 text-center sm:text-left">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        {product.short_description ? (
          <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
            {product.short_description}
          </p>
        ) : null}
        <div className="mt-auto pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Precio
          </p>
          <Price
            value={Number(product.price)}
            currency={product.currency}
            className="mt-1 block text-2xl font-bold text-accent"
          />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <Link to="/producto/$slug" params={{ slug: product.slug }}>
              <Eye className="mr-1 h-4 w-4" />
              Detalles
            </Link>
          </Button>
          <Button
            className="btn-hero flex-1 rounded-full"
            aria-label={`Agregar ${product.name} al carrito`}
            onClick={() => {
              addItem(product, 1);
              toast.success("Agregado al carrito", {
                description: `${product.name} quedo listo para revisar el pedido.`,
              });
            }}
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            Agregar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
