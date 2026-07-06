import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap, Layers, MessageCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { homeConfig } from "@/config/home.config";
import { brandConfig } from "@/config/brand.config";
import { buildWhatsappContactUrl } from "@/utils/whatsapp";

export const Route = createFileRoute("/")({
  component: Home,
});

const ICONS = [Sparkles, Zap, Layers];

function Home() {
  const { hero, benefits, howItWorks, finalCta } = homeConfig;
  const secondaryHref =
    hero.secondaryCta.href === "whatsapp" ? buildWhatsappContactUrl() : hero.secondaryCta.href;
  const isSecondaryExternal = hero.secondaryCta.href === "whatsapp";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
        </div>
        <Container className="text-center">
          <p className="mb-4 inline-block rounded-full border border-border/60 bg-background/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            {hero.eyebrow}
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="btn-hero">
              <Link to={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              {isSecondaryExternal ? (
                <a href={secondaryHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {hero.secondaryCta.label}
                </a>
              ) : (
                <Link to={secondaryHref}>{hero.secondaryCta.label}</Link>
              )}
            </Button>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((b, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={b.title} className="card-surface p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* How it works */}
      <Section className="pt-0">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-3 text-muted-foreground">Un proceso simple y transparente.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {howItWorks.map((s) => (
            <div key={s.step} className="card-surface p-6">
              <div className="mb-3 text-4xl font-bold text-accent">{s.step}</div>
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="card-surface relative overflow-hidden p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-accent)] opacity-10" />
          <h2 className="relative text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {finalCta.title}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
            {finalCta.subtitle}
          </p>
          <div className="relative mt-8">
            <Button asChild size="lg" className="btn-hero">
              <a href={buildWhatsappContactUrl()} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" />
                {finalCta.ctaLabel}
              </a>
            </Button>
          </div>
          <p className="relative mt-4 text-xs text-muted-foreground">
            {brandConfig.phone}
          </p>
        </div>
      </Section>
    </>
  );
}
