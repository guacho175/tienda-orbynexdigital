import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Layers,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { Price } from "@/components/ui-common/Price";
import { homeConfig } from "@/config/home.config";
import { brandConfig } from "@/config/brand.config";
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
  const previewProduct = products?.[0] ?? null;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/50 py-14 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(0deg,oklch(1_0_0/0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <Container className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-4 py-3 shadow-[0_18px_60px_-28px_oklch(0.82_0.15_200/0.7)] backdrop-blur">
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.name}
                className="h-12 w-auto max-w-[210px] object-contain"
                width={291}
                height={80}
              />
            </div>
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
                <a href={hero.secondaryCta.href}>
                  {hero.secondaryCta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {["Pagos online", "Pedidos claros", "Catalogo editable"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/50 bg-background/35 px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface overflow-hidden rounded-3xl border-accent/20 bg-background/70 p-4 shadow-[0_28px_90px_-42px_oklch(0.82_0.15_200/0.8)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Vista de tienda
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Pedido comercial</h2>
              </div>
              <div className="rounded-2xl bg-[image:var(--gradient-accent)] p-3 text-background">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[0.88fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/75">
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
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase text-accent">
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
                      className="flex gap-3 rounded-2xl border border-border/50 bg-background/35 p-4"
                    >
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
            <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-medium text-foreground">
                La tienda muestra valor, precio y siguiente paso sin obligar al cliente a preguntar
                por informacion basica.
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
              description="Cuando publiques productos activos apareceran destacados en la portada."
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
              className="group rounded-2xl border border-border/60 bg-card/70 px-5 py-5 text-center font-semibold text-foreground transition duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="block">{category}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Ver servicios
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
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
              <Link to="/catalogo">{finalCta.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
