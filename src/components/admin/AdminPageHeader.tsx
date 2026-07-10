import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn("border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8", className)}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
