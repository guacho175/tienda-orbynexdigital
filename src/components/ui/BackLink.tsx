import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  to: "/" | "/catalogo" | "/carrito" | "/checkout";
  label: string;
  className?: string;
};

export function BackLink({ to, label, className }: BackLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:bg-white/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
