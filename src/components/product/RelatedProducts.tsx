import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { commerceConfig } from "@/config/commerce.config";
import type { ProductCardData } from "@/types/product";

type RelatedProductsProps = {
  products: ProductCardData[];
  isLoading: boolean;
};

export function RelatedProducts({ products, isLoading }: RelatedProductsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const { eyebrow, title, previousLabel, nextLabel, limit } = commerceConfig.relatedProducts;

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const remaining = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft;
    setCanScrollBack(scroller.scrollLeft > 1);
    setCanScrollForward(remaining > 1);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(scroller);
    scroller.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", updateScrollState);
    };
  }, [products, updateScrollState]);

  const scroll = (direction: "back" | "forward") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === "back" ? -scroller.clientWidth * 0.85 : scroller.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mt-20 border-t border-white/8 pt-12 sm:mt-24 sm:pt-16">
      <div className="flex items-end justify-between gap-4">
        <div className="text-left">
          <p className="eyebrow-tech text-xs font-semibold uppercase text-accent">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {!isLoading && (canScrollBack || canScrollForward) ? (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full bg-white/3"
              aria-label={previousLabel}
              disabled={!canScrollBack}
              onClick={() => scroll("back")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full bg-white/3"
              aria-label={nextLabel}
              disabled={!canScrollForward}
              onClick={() => scroll("forward")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="-mx-4 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: limit }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[430px] w-[min(84vw,22rem)] shrink-0 snap-start rounded-[1.25rem] sm:w-[22rem] lg:w-auto"
              />
            ))
          : products.map((product) => (
              <div
                key={product.id}
                className="w-[min(84vw,22rem)] shrink-0 snap-start sm:w-[22rem] lg:w-auto"
              >
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}
