import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { brandConfig } from "@/config/brand.config";
import { navigationConfig } from "@/config/navigation.config";
import { useCart } from "@/store/cart.store";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            {brandConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigationConfig.primary.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/carrito"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary"
            aria-label="Ver carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-1 text-xs font-semibold text-background">
                {count}
              </span>
            ) : null}
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <div className={cn("border-t border-border/50 md:hidden", open ? "block" : "hidden")}>
        <Container className="flex flex-col gap-1 py-3">
          {navigationConfig.primary.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  );
}