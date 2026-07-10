import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, ClipboardList, LogOut, Package, ShoppingBag, Store } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type AdminShellTone = "dark" | "light";

interface AdminShellProps {
  children: ReactNode;
  tone?: AdminShellTone;
  contentClassName?: string;
}

const ADMIN_NAV_ITEMS = [
  { label: "Catalogo", to: "/admin", icon: ShoppingBag },
  { label: "Analitica", to: "/admin/analytics", icon: BarChart3 },
  { label: "Auditoria", to: "/admin/audit", icon: ClipboardList },
  { label: "Productos", to: "/catalogo", icon: Package },
] as const;

export function AdminShell({ children, tone = "dark", contentClassName }: AdminShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLight = tone === "light";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <section
      className={cn(
        "mx-auto my-6 grid min-h-[calc(100vh-11rem)] w-[min(92rem,calc(100%_-_1rem))] overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:grid-cols-[240px_minmax(0,1fr)]",
        isLight ? "bg-slate-50" : "bg-[#071a3d]/60",
      )}
    >
      <aside className="flex flex-col border-b border-white/10 bg-[#061936] px-4 py-6 text-white lg:border-b-0 lg:border-r">
        <Link to="/admin" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-blue-500/10 text-cyan-300">
            <Store className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-heading text-xl font-bold leading-none">orbynex</span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Admin
            </span>
          </span>
        </Link>

        <nav aria-label="Menu admin" className="mt-8 flex flex-col gap-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                  active && "bg-white/8 text-cyan-300",
                )}
              >
                {active ? (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-cyan-300" />
                ) : null}
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-5 lg:mt-auto">
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

      <div
        className={cn(
          "min-w-0",
          isLight
            ? "bg-slate-50 text-slate-950 [--accent:oklch(0.70_0.16_232)] [--accent-foreground:oklch(0.99_0.005_250)] [--border:oklch(0.88_0.03_250)] [--card-foreground:oklch(0.17_0.03_260)] [--card:oklch(1_0_0)] [--foreground:oklch(0.17_0.03_260)] [--input:oklch(0.88_0.03_250)] [--muted-foreground:oklch(0.47_0.04_255)] [--muted:oklch(0.95_0.02_250)] [--popover-foreground:oklch(0.17_0.03_260)] [--popover:oklch(1_0_0)] [--secondary-foreground:oklch(0.25_0.03_260)] [--secondary:oklch(0.96_0.02_250)]"
            : "bg-[#071a3d]/35",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
