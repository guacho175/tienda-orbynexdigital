import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, LogOut, Package, Shield, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteProduct,
  fetchAllProductsAdmin,
  toggleProductActive,
} from "@/services/products.service";
import { Price } from "@/components/ui-common/Price";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ProductImage } from "@/components/product/ProductImage";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/")({
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleProductActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: Error) =>
      toast.error("No se pudo cambiar el estado", {
        description: err.message || "Revisa tu conexion e intenta nuevamente.",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Producto eliminado", {
        description: "El catalogo se actualizo correctamente.",
      });
    },
    onError: (err: Error) =>
      toast.error("No se pudo eliminar el producto", {
        description: err.message || "Revisa permisos, dependencias o intenta nuevamente.",
      }),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function renderProductActions(p: Product) {
    return (
      <div className="flex justify-end gap-1">
        {p.slug ? (
          p.is_active ? (
            <Button asChild variant="ghost" size="sm">
              <a
                href={`/producto/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ver producto ${p.name}`}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Ver producto</span>
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title="Producto inactivo; no visible publicamente"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver producto</span>
            </Button>
          )
        ) : null}
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/edit/$id" params={{ id: p.id }}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminara "{p.name}" permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (isAdmin === null) {
    return <Container className="py-24 text-center text-muted-foreground">Cargando...</Container>;
  }

  if (isAdmin === false) {
    return (
      <Container className="py-24">
        <div className="card-surface mx-auto max-w-lg p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta ({email}) no tiene el rol{" "}
            <code className="rounded bg-secondary px-1">admin</code>. Solicita al administrador que
            te asigne el rol para acceder al panel.
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
            <Button asChild className="btn-hero">
              <Link to="/admin/new">
                <Plus className="mr-1 h-4 w-4" /> Nuevo producto
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Ver sitio</Link>
            </Button>
            <Button onClick={handleSignOut} variant="ghost">
              <LogOut className="mr-1 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>

        <div className="space-y-4 md:hidden">
          {(products ?? []).map((p) => (
            <article key={p.id} className="card-surface p-4">
              <div className="grid grid-cols-[4.5rem_1fr] gap-4">
                <ProductImage
                  src={p.image_url}
                  thumbSrc={p.image_url_thumb}
                  cardSrc={p.image_url_card}
                  detailSrc={p.image_url_detail}
                  alt={`Miniatura de ${p.name}`}
                  variant="thumb"
                  sizes="4.5rem"
                  className="aspect-square rounded-xl"
                  iconClassName="h-6 w-6"
                />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-semibold text-foreground">{p.name}</h2>
                      <p className="mt-1 truncate text-xs text-muted-foreground">/{p.slug}</p>
                    </div>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {p.category ?? "Sin categoria"}
                      </p>
                      <Price value={Number(p.price)} currency={p.currency} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
                      />
                      {renderProductActions(p)}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {(products ?? []).length === 0 ? (
            <div className="card-surface px-4 py-10 text-center text-muted-foreground">
              No hay productos aun.
            </div>
          ) : null}
        </div>

        <div className="card-surface hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="grid grid-cols-[3.75rem_1fr] items-center gap-3">
                      <ProductImage
                        src={p.image_url}
                        thumbSrc={p.image_url_thumb}
                        cardSrc={p.image_url_card}
                        detailSrc={p.image_url_detail}
                        alt={`Miniatura de ${p.name}`}
                        variant="thumb"
                        sizes="3.75rem"
                        className="aspect-square rounded-xl"
                        iconClassName="h-5 w-5"
                      />
                      <div className="min-w-0">
                        <div className="line-clamp-2">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Price value={Number(p.price)} currency={p.currency} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
                      />
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.slug ? (
                        p.is_active ? (
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={`/producto/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Ver producto ${p.name}`}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver producto</span>
                            </a>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled
                            title="Producto inactivo; no visible publicamente"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver producto</span>
                          </Button>
                        )
                      ) : null}
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/edit/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará "{p.name}"
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
              {(products ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No hay productos aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Container>
    </>
  );
}
