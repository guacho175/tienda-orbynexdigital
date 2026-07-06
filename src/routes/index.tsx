import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Layers,
  Package,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { homeConfig } from "@/config/home.config";
import { fetchFeaturedProducts, PRODUCTS_STALE_TIME_MS } from "@/services/products.service";

export const Route = createFileRoute("/")({
  component: Home,
});

const HIGHLIGHT_ICONS = [Layers, ShoppingCart, CreditCard];

function Home() {
  const { hero, storeHighlights, howItWorks, demoSection, featuredProducts, categories, finalCta } =
    homeConfig;
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", "featured", featuredProducts.limit],
    queryFn: () => fetchFeaturedProducts(featuredProducts.limit),
    staleTime: PRODUCTS_STALE_TIME_MS,
  });

  const derivedCategories = Array.from(
    new Set((products ?? []).map((product) => product.category).filter(Boolean)),
  ) as string[];
  const visibleCategories =
    derivedCategories.length > 0 ? derivedCategories : homeConfig.categoriesFallback;

  return (
    <>
      <section className="border-b border-border/50 py-16 sm:py-20 lg:py-24">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.eyebrow}
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:mx-0">
              {hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground lg:mx-0">
              {hero.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" className="btn-hero">
                <Link to="/catalogo">
                  {hero.primaryCta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/carrito">
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  {hero.secondaryCta.label}
                </Link>
              </Button>
            </div>
          </div>

          <div className="card-surface overflow-hidden p-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase text-accent">Flujo demo</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Compra online real</h2>
              </div>
              <div className="rounded-full bg-[image:var(--gradient-accent)] p-3 text-background">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {["Catalogo", "Carrito", "Checkout", "Resultado Flow"].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/35 px-4 py-3"
                >
                  <span className="font-medium text-foreground">{item}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-medium text-foreground">
                Productos destacados visibles desde el inicio y checkout conectado a Flow, WhatsApp
                o payment_url.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">
              {featuredProducts.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {featuredProducts.title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{featuredProducts.subtitle}</p>
          </div>
          <Button asChild variant="outline" className="self-center sm:self-auto">
            <Link to="/catalogo">{featuredProducts.cta.label}</Link>
          </Button>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[430px] w-full rounded-lg" />
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
              description="Cuando publiques productos en Supabase apareceran destacados en la portada."
              action={
                <Button asChild className="btn-hero">
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

      <Section className="border-y border-border/50 bg-background/25">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase text-accent">{categories.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {categories.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{categories.subtitle}</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((category) => (
            <Link
              key={category}
              to="/catalogo"
              className="rounded-lg border border-border/60 bg-card/70 px-5 py-4 text-center font-semibold text-foreground transition-colors hover:border-accent/50 hover:bg-secondary"
            >
              {category}
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {storeHighlights.map((item, index) => {
            const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
            return (
              <div key={item.title} className="card-surface p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Como funciona la compra
          </h2>
          <p className="mt-3 text-muted-foreground">
            Un flujo de tienda pensado para probar catalogo, carrito, pago y confirmacion.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step) => (
            <div key={step.step} className="card-surface p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {step.step}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-y border-border/50 bg-background/25">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase text-accent">{demoSection.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {demoSection.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{demoSection.description}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button asChild className="btn-hero">
                <Link to="/catalogo">{demoSection.cta.label}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/checkout">{demoSection.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {demoSection.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/70 px-4 py-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{finalCta.subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="btn-hero">
              <Link to="/catalogo">{finalCta.primaryCta.label}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/carrito">{finalCta.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
