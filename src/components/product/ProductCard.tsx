import { Link } from "@tanstack/react-router";
import { Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui-common/Price";
import { useCart } from "@/store/cart.store";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { ProductImage } from "@/components/product/ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="card-surface group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-accent/40">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/40">
        <ProductImage
          src={product.image_url}
          alt={`Imagen de ${product.name}`}
          className="h-full w-full"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
        />
        {product.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
            {product.category}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        {product.short_description ? (
          <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
            {product.short_description}
          </p>
        ) : null}
        <div className="mt-5">
          <Price
            value={Number(product.price)}
            currency={product.currency}
            className="text-2xl font-bold text-accent"
          />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/producto/$slug" params={{ slug: product.slug }}>
              <Eye className="mr-1 h-4 w-4" />
              Ver producto
            </Link>
          </Button>
          <Button
            className="btn-hero flex-1"
            onClick={() => {
              addItem(product, 1);
              toast.success("Agregado al carrito", { description: product.name });
            }}
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>
    </article>
  );
}
