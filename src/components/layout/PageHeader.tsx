import { Container } from "./Container";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-white/8 py-8 sm:py-10 lg:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.82_0.1_214/0.14),transparent_0_42%),linear-gradient(180deg,transparent,oklch(0.1_0.03_255/0.24))]" />
      <Container>
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
          {eyebrow ? (
            <p className="eyebrow-tech text-sm font-semibold uppercase tracking-widest text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground lg:mx-0">
              {subtitle}
            </p>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
