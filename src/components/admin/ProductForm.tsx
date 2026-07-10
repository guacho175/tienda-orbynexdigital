import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PRODUCT_EDITOR_SECTIONS } from "@/config/product-editor.config";
import type { Product } from "@/types/product";
import type { ProductInput } from "@/services/products.service";
import { ProductEditorActionsBar } from "./product-editor/ProductEditorActionsBar";
import { ProductEditorLayout } from "./product-editor/ProductEditorLayout";
import { ProductEditorNav } from "./product-editor/ProductEditorNav";
import { ProductGeneralSection } from "./product-editor/ProductGeneralSection";
import { ProductInventorySection } from "./product-editor/ProductInventorySection";
import { ProductStockMovementsSection } from "./product-editor/ProductStockMovementsSection";
import { ProductMediaSection } from "./product-editor/ProductMediaSection";
import { ProductOrganizationSection } from "./product-editor/ProductOrganizationSection";
import { ProductPricingSection } from "./product-editor/ProductPricingSection";
import { ProductSeoSection } from "./product-editor/ProductSeoSection";
import { useProductEditor } from "./product-editor/useProductEditor";

export interface ProductFormProps {
  initial?: Product | null;
  stockMovementsProduct?: Product | null;
  submitLabel?: string;
  onSubmit: (values: ProductInput) => Promise<void>;
  onCancel?: () => void;
}

function formatUpdatedAt(value: string | undefined) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function ProductForm({
  initial,
  stockMovementsProduct,
  submitLabel = "Guardar",
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const editor = useProductEditor({ initial, onSubmit });
  const activeSection = PRODUCT_EDITOR_SECTIONS.find(
    (section) => section.id === editor.activeSection,
  );
  const totalErrors = Object.keys(editor.errors).length;
  const updatedAt = formatUpdatedAt(initial?.updated_at);
  const disabled = editor.submitting;

  function requestCancel() {
    if (!onCancel) return;
    if (editor.isDirty) {
      setCancelDialogOpen(true);
      return;
    }
    onCancel();
  }

  return (
    <>
      <form onSubmit={editor.handleSubmit} noValidate className="space-y-4">
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant={editor.values.is_active ? "default" : "secondary"}>
                {editor.values.is_active ? "Activo" : "Inactivo"}
              </Badge>
              <span className="text-sm font-medium text-foreground">
                {editor.values.name || "Nuevo producto"}
              </span>
            </div>
            {updatedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Última actualización: {updatedAt}
              </p>
            ) : null}
          </div>
          <span className="text-xs font-medium text-muted-foreground sm:text-right">
            Sección {activeSection?.label ?? "General"}
          </span>
        </div>

        {totalErrors > 0 ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Hay {totalErrors} {totalErrors === 1 ? "campo pendiente" : "campos pendientes"}. Revisa
            las secciones marcadas antes de guardar.
          </div>
        ) : null}

        <ProductEditorLayout
          navigation={
            <ProductEditorNav
              activeSection={editor.activeSection}
              errorCountBySection={editor.errorCountBySection}
              showStockMovements={Boolean(stockMovementsProduct)}
              onChange={editor.setActiveSection}
            />
          }
        >
          {editor.activeSection === "general" ? (
            <ProductGeneralSection
              values={editor.values}
              errors={editor.errors}
              update={editor.update}
              updateName={editor.updateName}
              disabled={disabled}
            />
          ) : null}
          {editor.activeSection === "inventory" ? (
            <ProductInventorySection
              values={editor.values}
              errors={editor.errors}
              update={editor.update}
              disabled={disabled}
              existingProduct={initial}
              onOpenStockMovements={() => editor.setActiveSection("stockMovements")}
            />
          ) : null}
          {editor.activeSection === "stockMovements" && stockMovementsProduct ? (
            <ProductStockMovementsSection product={stockMovementsProduct} />
          ) : null}
          {editor.activeSection === "pricing" ? (
            <ProductPricingSection
              values={editor.values}
              errors={editor.errors}
              update={editor.update}
              disabled={disabled}
            />
          ) : null}
          {editor.activeSection === "media" ? (
            <ProductMediaSection
              values={editor.values}
              errors={editor.errors}
              update={editor.update}
              disabled={disabled}
              uploadingImage={editor.uploadingImage}
              imageUploadPhase={editor.imageUploadPhase}
              imageUploadError={editor.imageUploadError}
              imageUploadResult={editor.imageUploadResult}
              hasLegacyImage={editor.hasLegacyImage}
              hasOptimizedVariants={editor.hasOptimizedVariants}
              updateManualImageUrl={editor.updateManualImageUrl}
              onImageUpload={editor.handleImageUpload}
            />
          ) : null}
          {editor.activeSection === "organization" ? (
            <ProductOrganizationSection
              values={editor.values}
              errors={editor.errors}
              update={editor.update}
              disabled={disabled}
            />
          ) : null}
          {editor.activeSection === "seo" ? (
            <ProductSeoSection
              values={editor.values}
              errors={editor.errors}
              update={editor.update}
              disabled={disabled}
            />
          ) : null}
        </ProductEditorLayout>

        <ProductEditorActionsBar
          isDirty={editor.isDirty}
          submitting={editor.submitting}
          uploadingImage={editor.uploadingImage}
          submitLabel={submitLabel}
          onCancel={onCancel ? requestCancel : undefined}
        />
      </form>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Los cambios realizados en este producto todavía no se han guardado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel}>Descartar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
