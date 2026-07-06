import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/BackLink";
import { Price } from "@/components/ui-common/Price";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { ProductImage } from "@/components/product/ProductImage";
import { useCart } from "@/store/cart.store";
import { brandConfig } from "@/config/brand.config";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [{ title: `Carrito - ${brandConfig.name}` }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, total, clear } = useCart();

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          title="Tu carrito"
          subtitle="Agrega productos desde el catalogo para probar el flujo de compra."
        />
        <Container className="py-8 sm:py-12">
          <BackLink to="/catalogo" label="Seguir comprando" />
          <div className="mt-8">
            <EmptyState
              icon={<ShoppingBag className="h-10 w-10" />}
              title="Tu carrito esta vacio"
              description="Explora productos digitales y agregalos para revisar el checkout."
              action={
                <Button asChild className="btn-hero">
                  <Link to="/catalogo">Ir al catalogo</Link>
                </Button>
              }
            />
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tu carrito"
        subtitle="Revisa productos, cantidades y total antes de continuar al checkout."
      />
      <Container className="py-8 sm:py-12">
        <BackLink to="/catalogo" label="Seguir comprando" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="card-surface grid gap-4 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
              >
                <ProductImage
                  src={item.image_url}
                  alt={`Imagen de ${item.name}`}
                  className="aspect-[4/3] w-full rounded-md sm:w-32"
                  iconClassName="h-8 w-8"
                />
                <div className="min-w-0">
                  <Link
                    to="/producto/$slug"
                    params={{ slug: item.slug }}
                    className="text-lg font-semibold text-foreground hover:text-accent"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Price
                      value={item.price}
                      currency={item.currency}
                      className="text-sm text-muted-foreground"
                    />
                    <span className="text-xs text-muted-foreground">Cantidad {item.quantity}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label={`Disminuir cantidad de ${item.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      aria-label={`Aumentar cantidad de ${item.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Price
                      value={item.price * item.quantity}
                      currency={item.currency}
                      className="text-lg font-semibold text-accent"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Eliminar ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center sm:justify-end">
              <Button variant="ghost" onClick={clear}>
                Vaciar carrito
              </Button>
            </div>
          </div>

          <aside className="card-surface h-fit p-6">
            <h3 className="text-lg font-semibold text-foreground">Resumen de compra</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <Price value={subtotal} className="text-foreground" />
              </div>
              <div className="flex justify-between border-t border-border/50 pt-4 text-base font-semibold">
                <span>Total</span>
                <Price value={total} className="text-2xl text-accent" />
              </div>
            </div>
            <Button asChild size="lg" className="btn-hero mt-6 h-auto min-h-10 w-full py-3">
              <Link to="/checkout" className="flex flex-col gap-1">
                <span>Continuar al checkout</span>
                <Price value={total} className="text-xs font-semibold text-primary-foreground/90" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/catalogo">Seguir comprando</Link>
            </Button>
          </aside>
        </div>
      </Container>
    </>
  );
}
