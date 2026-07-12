import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { brandConfig } from "@/config/brand.config";
import { accountConfig } from "@/config/account.config";
import { navigationConfig } from "@/config/navigation.config";
import { useCart } from "@/store/cart.store";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { count, openDrawer } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-white/8 bg-[oklch(0.12_0.03_256/0.74)] backdrop-blur-xl">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 rounded-full px-2 py-1">
          <img
            src={brandConfig.logoUrl}
            alt={brandConfig.name}
            className="h-10 w-auto max-w-[180px] object-contain"
            width={291}
            height={80}
          />
        </Link>

        <nav className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/4 px-3 py-2 md:flex">
          {navigationConfig.primary.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white/6 hover:text-foreground"
              activeProps={{
                className: "bg-white/8 text-foreground shadow-[inset_0_0_0_1px_oklch(1_0_0/0.06)]",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={accountConfig.routes.account}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={accountConfig.navigation.accountAriaLabel}
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">{accountConfig.navigation.accountLabel}</span>
          </Link>
          <button
            type="button"
            className="relative inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Ver carrito"
            onClick={openDrawer}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-1 text-xs font-semibold text-background">
                {count}
              </span>
            ) : null}
          </button>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <div
        className={cn(
          "border-t border-white/8 bg-[oklch(0.12_0.03_256/0.9)] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="flex flex-col items-center gap-2 py-4 text-center">
          {navigationConfig.primary.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="w-full max-w-sm rounded-full border border-white/6 bg-white/4 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={accountConfig.routes.account}
            onClick={() => setOpen(false)}
            className="w-full max-w-sm rounded-full border border-white/6 bg-white/4 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
          >
            {accountConfig.navigation.accountLabel}
          </Link>
        </Container>
      </div>
    </header>
  );
}
