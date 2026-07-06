import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Package, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllProductsAdmin } from "@/services/products.service";
import { Price } from "@/components/ui-common/Price";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setEmail(userData.user.email ?? "");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
    })();
  }, []);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAllProductsAdmin,
    enabled: isAdmin === true,
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === null) {
    return (
      <Container className="py-24 text-center text-muted-foreground">Cargando...</Container>
    );
  }

  if (isAdmin === false) {
    return (
      <Container className="py-24">
        <div className="card-surface mx-auto max-w-lg p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta ({email}) no tiene el rol <code className="rounded bg-secondary px-1">admin</code>.
            Solicita al administrador que te asigne el rol para acceder al panel.
          </p>
          <Button onClick={handleSignOut} variant="outline" className="mt-6">
            <LogOut className="mr-1 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Panel"
        title="Administración"
        subtitle={`Bienvenido, ${email}. Gestiona el catálogo de productos.`}
      />
      <Container className="py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {products?.length ?? 0} productos en total
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">Ver sitio</Link>
            </Button>
            <Button onClick={handleSignOut} variant="ghost">
              <LogOut className="mr-1 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>

        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Price value={Number(p.price)} currency={p.currency} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {(products ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No hay productos aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          El CRUD completo (crear / editar / activar) se entregará en la Fase 2.
        </p>
      </Container>
    </>
  );
}