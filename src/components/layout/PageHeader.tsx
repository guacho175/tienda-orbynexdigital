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
    <div className="border-b border-border/50 py-14 sm:py-20">
      <Container>
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        ) : null}
      </Container>
    </div>
  );
}