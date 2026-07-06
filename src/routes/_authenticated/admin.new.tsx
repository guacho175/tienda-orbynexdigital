import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/services/products.service";

export const Route = createFileRoute("/_authenticated/admin/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Producto creado", {
        description: "Ya esta disponible para gestionar en el panel.",
      });
      navigate({ to: "/admin" });
    },
    onError: (err: Error) => {
      toast.error("No se pudo crear el producto", {
        description: err.message || "Revisa los campos e intenta nuevamente.",
      });
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Nuevo producto"
        subtitle="Crea un producto para el catálogo."
      />
      <Container className="py-8">
        <ProductForm
          submitLabel="Crear producto"
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
          }}
          onCancel={() => navigate({ to: "/admin" })}
        />
      </Container>
    </>
  );
}
