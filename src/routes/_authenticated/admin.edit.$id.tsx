import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchProductByIdAdmin, updateProduct } from "@/services/products.service";

export const Route = createFileRoute("/_authenticated/admin/edit/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = useParams({ from: "/_authenticated/admin/edit/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => fetchProductByIdAdmin(id),
  });

  const mutation = useMutation({
    mutationFn: (values: Parameters<typeof updateProduct>[1]) => updateProduct(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      toast.success("Producto actualizado");
      navigate({ to: "/admin" });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Error al actualizar");
    },
  });

  return (
    <>
      <PageHeader eyebrow="Admin" title="Editar producto" subtitle={product?.name ?? ""} />
      <Container className="py-8">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : !product ? (
          <p className="text-center text-muted-foreground">Producto no encontrado.</p>
        ) : (
          <ProductForm
            initial={product}
            submitLabel="Guardar cambios"
            onSubmit={async (values) => {
              await mutation.mutateAsync(values);
            }}
            onCancel={() => navigate({ to: "/admin" })}
          />
        )}
      </Container>
    </>
  );
}