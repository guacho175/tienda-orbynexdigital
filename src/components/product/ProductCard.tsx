import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui-common/Price";
import { useCart } from "@/store/cart.store";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { ProductImage } from "@/components/product/ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="card-surface group flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/40">
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
        <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
        {product.short_description ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {product.short_description}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between">
          <Price value={Number(product.price)} currency={product.currency} className="text-xl" />
        </div>
        <div className="mt-5 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/producto/$slug" params={{ slug: product.slug }}>
              Ver detalle
            </Link>
          </Button>
          <Button
            className="btn-hero flex-1"
            onClick={() => {
              addItem(product, 1);
              toast.success("Agregado al carrito", { description: product.name });
            }}
          >
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
