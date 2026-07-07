import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Price } from "@/components/ui-common/Price";
import { cn } from "@/lib/utils";
import { fetchFeaturedProducts, PRODUCTS_STALE_TIME_MS } from "@/services/products.service";
import { useCart } from "@/store/cart.store";

export function CartDrawer() {
  const { items, count, total, drawerOpen, setDrawerOpen, closeDrawer, addItem, updateQuantity } =
    useCart();
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["cart-drawer-featured-products"],
    queryFn: () => fetchFeaturedProducts(8),
    staleTime: PRODUCTS_STALE_TIME_MS,
    enabled: drawerOpen,
  });

  useEffect(() => {
    if (!items.length) {
      setOpenItemId(null);
      return;
    }
    setOpenItemId((current) =>
      current && items.some((item) => item.productId === current) ? current : items[0].productId,
    );
  }, [items]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const recommendations = useMemo(() => {
    const selected = new Set(items.map((item) => item.productId));
    return featuredProducts.filter((product) => !selected.has(product.id)).slice(0, 2);
  }, [featuredProducts, items]);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        showClose={false}
        className="flex h-dvh w-full max-w-none flex-col gap-0 border-l border-white/10 bg-[oklch(0.105_0.035_264/0.96)] p-0 shadow-2xl backdrop-blur-2xl sm:w-[420px] sm:max-w-[420px]"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/15 text-cyan-300 shadow-[0_0_22px_oklch(0.78_0.13_214/0.24)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-xl font-bold tracking-tight text-foreground">
                Agregaste a tu carrito
              </SheetTitle>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {count} {count === 1 ? "servicio seleccionado" : "servicios seleccionados"}
              </p>
            </div>
          </div>
          <SheetClose asChild>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Cerrar carrito"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {items.length ? (
            <div className="space-y-4">
              {items.map((item) => {
                const isOpen = openItemId === item.productId;
                const description =
                  item.short_description ?? item.category ?? "Servicio listo para revisar.";
                return (
                  <section
                    key={item.productId}
                    className="overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.035] shadow-[0_18px_50px_-36px_oklch(0.02_0.02_258/0.9)]"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onClick={() => setOpenItemId(isOpen ? null : item.productId)}
                      aria-expanded={isOpen}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-base font-bold text-foreground">
                          {item.name}
                        </span>
                        <Price
                          value={item.price * item.quantity}
                          currency={item.currency}
                          className="mt-1 block text-sm font-bold text-magenta"
                        />
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                          isOpen ? "rotate-180" : "",
                        )}
                      />
                    </button>

                    {isOpen ? (
                      <div className="grid grid-cols-[5rem_1fr] gap-4 border-t border-white/8 px-4 py-4">
                        <ProductImage
                          src={item.image_url}
                          thumbSrc={item.image_url_thumb}
                          cardSrc={item.image_url_card}
                          detailSrc={item.image_url_detail}
                          alt={`Imagen de ${item.name}`}
                          variant="thumb"
                          sizes="5rem"
                          className="h-20 w-20 rounded-lg"
                          iconClassName="h-7 w-7"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm text-foreground/82">{description}</p>
                          <div className="mt-4 flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-white/5"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-6 text-center font-mono text-sm font-bold text-foreground">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-white/5"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-6 text-center">
              <ShoppingCart className="mx-auto h-9 w-9 text-cyan-300" />
              <p className="mt-4 font-semibold text-foreground">Tu carrito esta vacio</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Agrega servicios desde el catalogo para preparar tu pedido.
              </p>
            </div>
          )}

          {recommendations.length ? (
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Recomendados para ti
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {recommendations.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition-colors hover:border-cyan-300/30"
                  >
                    <ProductImage
                      src={product.image_url}
                      thumbSrc={product.image_url_thumb}
                      cardSrc={product.image_url_card}
                      detailSrc={product.image_url_detail}
                      alt={`Imagen de ${product.name}`}
                      variant="thumb"
                      sizes="9rem"
                      className="aspect-square rounded-lg"
                      imageClassName="transition-transform duration-300 hover:scale-105"
                      iconClassName="h-7 w-7"
                    />
                    <h4 className="mt-3 line-clamp-1 text-sm font-semibold text-foreground">
                      {product.name}
                    </h4>
                    <Price
                      value={Number(product.price)}
                      currency={product.currency}
                      className="mt-1 block text-sm font-bold text-cyan-300"
                    />
                    <Button
                      size="sm"
                      className="btn-hero mt-3 h-9 w-full rounded-lg text-xs"
                      onClick={() => {
                        addItem(product, 1);
                        toast.success("Agregado al carrito", {
                          description: `${product.name} quedo listo para revisar el pedido.`,
                        });
                      }}
                    >
                      <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/8 bg-[oklch(0.08_0.03_264/0.86)] px-5 py-5 backdrop-blur-xl sm:px-6">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-base text-foreground/80">Total estimado</span>
            <Price value={total} className="text-2xl font-extrabold text-foreground" />
          </div>
          <Button
            asChild
            className="h-14 w-full rounded-[1rem] bg-blue-600 text-base font-bold hover:bg-blue-500"
          >
            <Link to="/carrito" onClick={closeDrawer}>
              Ir al carrito
            </Link>
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              className="mt-3 h-14 w-full rounded-[1rem] border-blue-500/50 bg-transparent text-base font-bold text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            >
              Ver mas productos
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
