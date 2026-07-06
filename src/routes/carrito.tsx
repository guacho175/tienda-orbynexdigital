import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui-common/Price";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { useCart } from "@/store/cart.store";
import { brandConfig } from "@/config/brand.config";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [{ title: `Carrito — ${brandConfig.name}` }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, total, clear } = useCart();

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Tu carrito" />
        <Container className="py-12">
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="Tu carrito está vacío"
            description="Explora el catálogo y agrega servicios para comenzar."
            action={
              <Button asChild className="btn-hero">
                <Link to="/catalogo">Ir al catálogo</Link>
              </Button>
            }
          />
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tu carrito" subtitle="Revisa tu pedido antes de finalizar la compra." />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="card-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-md bg-secondary/40 sm:w-32">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Link
                  to="/producto/$slug"
                  params={{ slug: item.slug }}
                  className="text-lg font-semibold text-foreground hover:text-accent"
                >
                  {item.name}
                </Link>
                <div className="mt-1">
                  <Price value={item.price} currency={item.currency} className="text-sm text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Price value={item.price * item.quantity} currency={item.currency} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.productId)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={clear}>
              Vaciar carrito
            </Button>
          </div>
        </div>

        <aside className="card-surface h-fit p-6">
          <h3 className="text-lg font-semibold text-foreground">Resumen</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <Price value={subtotal} className="text-foreground" />
            </div>
            <div className="flex justify-between border-t border-border/50 pt-3 text-base font-semibold">
              <span>Total</span>
              <Price value={total} className="text-lg" />
            </div>
          </div>
          <Button asChild size="lg" className="btn-hero mt-6 w-full">
            <Link to="/checkout">Finalizar compra</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/catalogo">Seguir comprando</Link>
          </Button>
        </aside>
      </Container>
    </>
  );
}