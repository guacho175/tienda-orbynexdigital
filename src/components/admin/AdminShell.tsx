import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ClipboardList,
  LogOut,
  Package,
  ReceiptText,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AdminShellProps {
  children: ReactNode;
  userEmail?: string;
}

const ADMIN_NAV_ITEMS = [
  { label: "Productos", to: "/admin", icon: ShoppingBag },
  { label: "Pedidos", to: "/admin/orders", icon: ReceiptText },
  { label: "Clientes", to: "/admin/users", icon: Users },
  { label: "Analitica", to: "/admin/analytics", icon: BarChart3 },
  { label: "Auditoria", to: "/admin/audit", icon: ClipboardList },
  { label: "Tienda", to: "/catalogo", icon: Package },
] as const;

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeItem = ADMIN_NAV_ITEMS.find((item) => {
    if (item.to === "/admin") {
      return (
        pathname === "/admin" || pathname === "/admin/new" || pathname.startsWith("/admin/edit")
      );
    }
    return pathname.startsWith(item.to);
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <section className="mx-auto grid h-[calc(100dvh-4.5rem)] w-full overflow-hidden bg-white lg:grid-cols-[228px_minmax(0,1fr)]">
      <aside className="flex shrink-0 flex-col border-b border-white/10 bg-[#061936] px-4 py-3 text-white lg:h-full lg:border-b-0 lg:border-r lg:py-5">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Link to="/admin" className="flex items-center gap-3 px-1 lg:px-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/30 bg-blue-500/10 text-cyan-300">
              <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-heading text-xl font-bold leading-none">orbynex</span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Admin
              </span>
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="shrink-0 gap-2 px-3 text-slate-200 hover:bg-white/8 hover:text-white lg:hidden"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>

        <nav
          aria-label="Menu admin"
          className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-7 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/admin"
                ? pathname === "/admin" ||
                  pathname === "/admin/new" ||
                  pathname.startsWith("/admin/edit")
                : pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:min-h-11 lg:gap-3",
                  active && "bg-white/8 text-cyan-300",
                )}
              >
                {active ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-cyan-300 lg:inset-x-auto lg:inset-y-2 lg:left-0 lg:h-auto lg:w-0.5" />
                ) : null}
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 hidden border-t border-white/10 pt-5 lg:mt-auto lg:block">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 px-3 text-slate-200 hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col bg-white text-slate-950 [--accent:oklch(0.58_0.18_232)] [--accent-foreground:oklch(0.99_0.005_250)] [--background:oklch(1_0_0)] [--border:oklch(0.88_0.03_250)] [--card-foreground:oklch(0.17_0.03_260)] [--card:oklch(1_0_0)] [--foreground:oklch(0.17_0.03_260)] [--input:oklch(0.88_0.03_250)] [--muted-foreground:oklch(0.42_0.04_255)] [--muted:oklch(0.97_0.01_250)] [--popover-foreground:oklch(0.17_0.03_260)] [--popover:oklch(1_0_0)] [--secondary-foreground:oklch(0.25_0.03_260)] [--secondary:oklch(0.97_0.01_250)]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {activeItem?.label ?? "Panel"}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Panel de administracion{userEmail ? ` - ${userEmail}` : ""}
            </p>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
      </div>
    </section>
  );
}
