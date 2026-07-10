import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Container } from "@/components/layout/Container";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchProductByIdAdmin, updateProduct } from "@/services/products.service";
import { createProductAuditEvent } from "@/services/product-audit.service";

export const Route = createFileRoute("/_authenticated/admin/edit/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = useParams({ from: "/_authenticated/admin/edit/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openedUpdatedAtRef = useRef<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => fetchProductByIdAdmin(id),
  });

  useEffect(() => {
    if (product?.updated_at && !openedUpdatedAtRef.current) {
      openedUpdatedAtRef.current = product.updated_at;
    }
  }, [product?.updated_at]);

  const mutation = useMutation({
    mutationFn: async (values: Parameters<typeof updateProduct>[1]) => {
      if (!product) throw new Error("Producto no encontrado.");

      const latestProduct = await fetchProductByIdAdmin(id);
      if (!latestProduct) throw new Error("Producto no encontrado.");

      const openedUpdatedAt = openedUpdatedAtRef.current ?? product.updated_at;
      if (latestProduct.updated_at !== openedUpdatedAt) {
        const shouldOverwrite = window.confirm(
          "Este producto fue actualizado despues de que abriste el editor. Aceptar sobrescribe esos cambios. Cancelar deja todo sin guardar para que puedas recargar.",
        );
        if (!shouldOverwrite) {
          throw new Error("Guardado cancelado para evitar sobrescribir cambios recientes.");
        }
      }

      const updatedProduct = await updateProduct(id, values);

      try {
        await createProductAuditEvent({
          productId: id,
          eventType: "product_update",
          before: latestProduct,
          after: updatedProduct,
        });
      } catch (error) {
        toast.warning("Producto actualizado sin auditoria", {
          description:
            error instanceof Error ? error.message : "No se pudo registrar el evento de auditoria.",
        });
      }

      return updatedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["product-audit-events"] });
      toast.success("Producto actualizado", {
        description: "Los cambios quedaron guardados en el catalogo.",
      });
      navigate({ to: "/admin" });
    },
    onError: (err: Error) => {
      toast.error("No se pudo actualizar el producto", {
        description: err.message || "Revisa los campos e intenta nuevamente.",
      });
    },
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Producto"
        title="Editar producto"
        subtitle={product?.name ?? "Ajusta la informacion del catalogo."}
      />
      <Container className="py-6 lg:py-8">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : !product ? (
          <p className="text-center text-muted-foreground">Producto no encontrado.</p>
        ) : (
          <>
            <ProductForm
              initial={product}
              stockAdjustmentProduct={product}
              submitLabel="Guardar cambios"
              onSubmit={async (values) => {
                await mutation.mutateAsync(values);
              }}
              onCancel={() => navigate({ to: "/admin" })}
            />
          </>
        )}
      </Container>
    </>
  );
}
