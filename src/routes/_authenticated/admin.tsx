import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Shield } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw redirect({ to: "/auth" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    return {
      adminEmail: userData.user.email ?? "",
      isAdmin: (roles ?? []).some((role) => role.role === "admin"),
    };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { adminEmail, isAdmin } = Route.useRouteContext();

  if (!isAdmin) {
    return (
      <Container className="py-24">
        <div className="card-surface mx-auto max-w-lg p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta ({adminEmail}) no tiene permisos para acceder al panel.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Volver al sitio</Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <AdminShell userEmail={adminEmail}>
      <Outlet />
    </AdminShell>
  );
}
