import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Globe2,
  Headphones,
  Layers,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { HeroFloaters } from "@/components/brand/BrandEffects";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { Price } from "@/components/ui-common/Price";
import { brandConfig } from "@/config/brand.config";
import { homeConfig } from "@/config/home.config";
import {
  fetchActiveProductCategories,
  fetchFeaturedProducts,
  PRODUCTS_STALE_TIME_MS,
} from "@/services/products.service";

export const Route = createFileRoute("/")({
  component: Home,
});

const HIGHLIGHT_ICONS = [Layers, ShoppingCart, CreditCard];

const CATEGORY_DETAILS = {
  "sitios web": {
    icon: Globe2,
    description: "Landing pages, sitios corporativos y presencia online lista para publicar.",
  },
  "e-commerce": {
    icon: ShoppingCart,
    description: "Catalogos, carritos y experiencias de compra para vender con claridad.",
  },
  automatizacion: {
    icon: Bot,
    description: "Procesos, formularios y flujos digitales para ahorrar tareas repetitivas.",
  },
  soporte: {
    icon: Headphones,
    description: "Mantencion, ajustes y acompanamiento para sostener tu operacion digital.",
  },
};

function getCategoryDetails(category: string) {
  const key = category.trim().toLowerCase();

  return (
    CATEGORY_DETAILS[key as keyof typeof CATEGORY_DETAILS] ?? {
      icon: Layers,
      description: "Servicios digitales organizados para que el cliente elija rapido.",
    }
  );
}

function Home() {
  const { hero, storeHighlights, howItWorks, demoSection, featuredProducts, categories, finalCta } =
    homeConfig;
  const categoryScrollerRef = useRef<HTMLDivElement>(null);
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", "featured", featuredProducts.limit],
    queryFn: () => fetchFeaturedProducts(featuredProducts.limit),
    staleTime: PRODUCTS_STALE_TIME_MS,
    refetchOnMount: "always",
  });
  const {
    data: activeCategories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["products", "active-categories"],
    queryFn: fetchActiveProductCategories,
    staleTime: PRODUCTS_STALE_TIME_MS,
    refetchOnMount: "always",
  });

  const visibleCategories = activeCategories ?? [];
  const previewProduct = products?.[0] ?? null;
  const heroAccent = "profesional";
  const heroTitleStart = hero.title.endsWith(heroAccent)
    ? hero.title.slice(0, -heroAccent.length).trimEnd()
    : hero.title;
  const scrollCategories = (direction: "left" | "right") => {
    categoryScrollerRef.current?.scrollBy({
      left: direction === "left" ? -380 : 380,
      behavior: "smooth",
    });
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/8 py-14 sm:py-20 lg:py-24">
        <HeroFloaters />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.84_0.11_214/0.15),transparent_0_34%),radial-gradient(circle_at_78%_20%,oklch(0.72_0.18_320/0.14),transparent_0_24%)]" />
        <Container className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-[0_18px_60px_-28px_oklch(0.82_0.15_200/0.7)] backdrop-blur">
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.name}
                className="h-12 w-auto max-w-[210px] object-contain"
                width={291}
                height={80}
              />
            </div>
            <p className="eyebrow-tech mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.eyebrow}
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:mx-0">
              <span>{heroTitleStart} </span>
              <span className="text-gradient">{heroAccent}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground lg:mx-0">
              {hero.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" className="btn-hero rounded-full px-7">
                <Link to="/catalogo">
                  {hero.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white/3">
                <a href={hero.secondaryCta.href}>
                  {hero.secondaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {["Pagos online", "Pedidos claros", "Catalogo editable"].map((item) => (
                <div
                  key={item}
                  data-interactive-card
                  className="card-surface flex items-center justify-center px-4 py-3 text-center"
                >
                  <div className="card-glow" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            data-interactive-card
            data-card-tilt="true"
            className="hero-panel card-surface section-sheen overflow-hidden rounded-[1.75rem] border-accent/15 p-4 shadow-[0_28px_90px_-42px_oklch(0.82_0.15_200/0.8)]"
          >
            <div className="card-glow" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
              <div className="text-center sm:text-left">
                <p className="eyebrow-tech text-xs font-semibold uppercase text-accent">
                  Vista de tienda
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Pedido comercial</h2>
              </div>
              <div className="rounded-2xl bg-[image:var(--gradient-accent)] p-3 text-background">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[0.88fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-card/75">
                <ProductImage
                  src={previewProduct?.image_url}
                  thumbSrc={previewProduct?.image_url_thumb}
                  cardSrc={previewProduct?.image_url_card}
                  detailSrc={previewProduct?.image_url_detail}
                  alt={previewProduct ? `Imagen de ${previewProduct.name}` : "Producto destacado"}
                  variant="card"
                  sizes="(max-width: 640px) 90vw, 18rem"
                  className="aspect-[4/3]"
                  imageClassName="transition-transform duration-500 hover:scale-105"
                  loading="eager"
                  priority
                />
                <div className="p-4 text-center sm:text-left">
                  <p className="eyebrow-tech text-xs font-semibold uppercase text-accent">
                    {previewProduct?.category ?? "Servicio digital"}
                  </p>
                  <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">
                    {previewProduct?.name ?? "Pack de presencia online"}
                  </h3>
                  <div className="mt-3">
                    {previewProduct ? (
                      <Price
                        value={Number(previewProduct.price)}
                        currency={previewProduct.currency}
                        className="text-2xl font-bold text-accent"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-accent">Cotizable</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: Layers,
                    title: "Elige el servicio",
                    copy: "Categoria, imagen y precio claro",
                  },
                  {
                    icon: ShoppingCart,
                    title: "Revisa el pedido",
                    copy: "Carrito ordenado antes de pagar",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Compra o conversa",
                    copy: "Pago online y contacto comercial disponibles",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      data-interactive-card
                      className="card-surface flex gap-3 rounded-2xl p-4 text-left"
                    >
                      <div className="card-glow" aria-hidden="true" />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 p-4 text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">
                La tienda muestra valor, precio y siguiente paso sin obligar al cliente a preguntar
                por informacion basica.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <div className="flex flex-col gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="eyebrow-tech text-sm font-semibold uppercase text-accent">
              {featuredProducts.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {featuredProducts.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground sm:mx-0">
              {featuredProducts.subtitle}
            </p>
          </div>
          <Button asChild variant="outline" className="self-center rounded-full sm:self-auto">
            <Link to="/catalogo">{featuredProducts.cta.label}</Link>
          </Button>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[430px] w-full rounded-[1.25rem]" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="No pudimos cargar los productos"
              description="Intenta recargar la pagina en unos segundos."
            />
          ) : (products ?? []).length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="Aun no hay productos activos"
              description="Cuando publiques productos activos apareceran destacados en la portada."
              action={
                <Button asChild className="btn-hero rounded-full">
                  <Link to="/catalogo">Ir al catalogo</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(products ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section className="border-y border-white/8 bg-white/2">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow-tech text-sm font-semibold uppercase text-accent">
            {categories.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {categories.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{categories.subtitle}</p>
        </div>
        {isLoadingCategories ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[92px] rounded-[1.25rem]" />
            ))}
          </div>
        ) : categoriesError ? (
          <div className="mt-10">
            <EmptyState
              title="No pudimos cargar las categorias"
              description="Recarga la pagina para intentar nuevamente."
            />
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No hay categorias publicadas"
              description="Las categorias apareceran cuando existan productos activos con categoria."
            />
          </div>
        ) : (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-center gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/3"
                aria-label="Ver categorias anteriores"
                onClick={() => scrollCategories("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/3"
                aria-label="Ver mas categorias"
                onClick={() => scrollCategories("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={categoryScrollerRef}
              className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scroll-smooth [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden ${
                visibleCategories.length <= 3 ? "lg:justify-center" : ""
              }`}
            >
              {visibleCategories.map((category) => {
                const details = getCategoryDetails(category);
                const Icon = details.icon;

                return (
                  <Link
                    key={category}
                    to="/catalogo"
                    data-interactive-card
                    className="card-surface group flex min-h-[172px] w-[min(82vw,21rem)] shrink-0 snap-center flex-col justify-between rounded-[1.25rem] px-5 py-5 text-left text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-[22rem] sm:px-6 sm:py-6"
                  >
                    <div className="card-glow" aria-hidden="true" />
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/12 text-accent">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-lg font-semibold leading-tight">
                          {category}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                          {details.description}
                        </span>
                      </span>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 self-start text-xs font-semibold uppercase tracking-wide text-accent">
                      Ver servicios
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {storeHighlights.map((item, index) => {
            const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
            return (
              <div
                key={item.title}
                data-interactive-card
                className="card-surface section-sheen p-6 text-center md:text-left"
              >
                <div className="card-glow" aria-hidden="true" />
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="como-comprar" className="pt-0">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Como compra tu cliente
          </h2>
          <p className="mt-3 text-muted-foreground">
            Una secuencia simple para elegir, revisar y confirmar sin perder contexto.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step) => (
            <div
              key={step.step}
              data-interactive-card
              className="card-surface p-6 text-center sm:text-left"
            >
              <div className="card-glow" aria-hidden="true" />
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {step.step}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-y border-white/8 bg-white/2">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="text-center lg:text-left">
            <p className="eyebrow-tech text-sm font-semibold uppercase text-accent">
              {demoSection.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {demoSection.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{demoSection.description}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button asChild className="btn-hero rounded-full">
                <Link to="/catalogo">{demoSection.cta.label}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full bg-white/3">
                <Link to="/checkout">{demoSection.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {demoSection.items.map((item) => (
              <div
                key={item}
                data-interactive-card
                className="card-surface flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left"
              >
                <div className="card-glow" aria-hidden="true" />
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div
          data-interactive-card
          className="card-surface section-sheen mx-auto max-w-4xl px-6 py-10 text-center sm:px-10"
        >
          <div className="card-glow" aria-hidden="true" />
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{finalCta.subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="btn-hero rounded-full px-7">
              <Link to="/catalogo">{finalCta.primaryCta.label}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-white/3">
              <Link to="/catalogo">{finalCta.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
