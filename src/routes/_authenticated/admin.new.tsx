import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Container } from "@/components/layout/Container";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/services/products.service";
import { createProductAuditEvent } from "@/services/product-audit.service";

export const Route = createFileRoute("/_authenticated/admin/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: Parameters<typeof createProduct>[0]) => {
      const product = await createProduct(values);
      try {
        await createProductAuditEvent({
          productId: product.id,
          eventType: "product_create",
          before: {},
          after: product,
          changedFields: ["product"],
        });
      } catch (error) {
        toast.warning("Producto creado sin auditoria", {
          description:
            error instanceof Error ? error.message : "No se pudo registrar el evento de auditoria.",
        });
      }
      return product;
    },
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
      <AdminPageHeader
        eyebrow="Producto"
        title="Nuevo producto"
        subtitle="Crea una ficha para publicar o gestionar dentro del catalogo."
      />
      <Container className="py-6 lg:py-8">
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
