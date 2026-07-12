import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Package, Plus, Pencil, Search, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { isLowStock, isSoldOut } from "@/utils/inventory";
import { AdminProductsSkeleton } from "@/components/admin/AdminProductsSkeleton";
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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: products,
    error: productsError,
    isError: isProductsError,
    isPending: isProductsPending,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAllProductsAdmin,
    staleTime: 60_000,
  });

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return products ?? [];

    return (products ?? []).filter((product) =>
      [product.name, product.slug, product.category, product.short_description].some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [products, searchTerm]);

  const hasProducts = filteredProducts.length > 0;
  const showEmptyState = !isProductsPending && !isProductsError && !hasProducts;

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleProductActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-audit-events"] });
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
      queryClient.invalidateQueries({ queryKey: ["product-audit-events"] });
      toast.success("Producto eliminado", {
        description: "El catalogo se actualizo correctamente.",
      });
    },
    onError: (err: Error) =>
      toast.error("No se pudo eliminar el producto", {
        description: err.message || "Revisa permisos, dependencias o intenta nuevamente.",
      }),
  });

  function renderProductActions(p: Product) {
    const prepareEditor = () => {
      queryClient.setQueryData(["admin-product", p.id], p);
    };

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
          <Link
            to="/admin/edit/$id"
            params={{ id: p.id }}
            preload="intent"
            onPointerEnter={prepareEditor}
            onPointerDown={prepareEditor}
            onFocus={prepareEditor}
            aria-label={`Editar ${p.name}`}
          >
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

  function renderStockBadge(p: Product) {
    if (!p.track_inventory) {
      return <Badge variant="secondary">Sin control de stock</Badge>;
    }
    if (isSoldOut(p)) {
      return (
        <Badge variant="destructive">
          {p.out_of_stock_behavior === "hide_product" ? "Oculto por stock" : "Agotado"}
        </Badge>
      );
    }
    if (isLowStock(p)) {
      return <Badge variant="outline">Pocas unidades: {p.stock_quantity}</Badge>;
    }
    return <Badge variant="outline">Stock: {p.stock_quantity}</Badge>;
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogo"
        title="Productos"
        subtitle="Gestiona catalogo, precios, visibilidad e inventario operativo desde una vista compacta."
        actions={
          <>
            <Button asChild className="btn-hero">
              <Link to="/admin/new">
                <Plus className="mr-1 h-4 w-4" /> Nuevo producto
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Ver sitio</Link>
            </Button>
          </>
        }
      />
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {isProductsPending
              ? "Cargando productos"
              : `${products?.length ?? 0} productos en total`}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, slug, categoria o descripcion"
            aria-label="Buscar productos"
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {isProductsPending ? <AdminProductsSkeleton /> : null}

        {isProductsError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-white px-4 py-10 text-center text-red-700 shadow-sm"
          >
            <p className="font-semibold">No se pudieron cargar los productos.</p>
            <p className="mt-1 text-sm text-red-600">
              {productsError instanceof Error
                ? productsError.message
                : "Revisa la conexion e intenta nuevamente."}
            </p>
          </div>
        ) : null}

        {!isProductsPending && !isProductsError ? (
          <div className="space-y-4 md:hidden">
            {filteredProducts.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
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
                        <div className="mt-2">{renderStockBadge(p)}</div>
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
            {showEmptyState ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-muted-foreground shadow-sm">
                {searchTerm
                  ? "No hay productos que coincidan con la busqueda."
                  : "No hay productos aun."}
              </div>
            ) : null}
          </div>
        ) : null}

        {!isProductsPending && !isProductsError ? (
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-200 bg-white text-left text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
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
                    <td className="px-4 py-3">{renderStockBadge(p)}</td>
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
                          <Link
                            to="/admin/edit/$id"
                            params={{ id: p.id }}
                            preload="intent"
                            onPointerEnter={() =>
                              queryClient.setQueryData(["admin-product", p.id], p)
                            }
                            onPointerDown={() =>
                              queryClient.setQueryData(["admin-product", p.id], p)
                            }
                            onFocus={() => queryClient.setQueryData(["admin-product", p.id], p)}
                            aria-label={`Editar ${p.name}`}
                          >
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
                {showEmptyState ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      {searchTerm
                        ? "No hay productos que coincidan con la busqueda."
                        : "No hay productos aún."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </>
  );
}
