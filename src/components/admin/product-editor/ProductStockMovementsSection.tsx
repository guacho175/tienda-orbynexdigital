import type { Product } from "@/types/product";
import { ProductStockAdjustmentPanel } from "@/components/admin/ProductStockAdjustmentPanel";
import { ProductEditorSection } from "./ProductEditorSection";

interface ProductStockMovementsSectionProps {
  product: Product;
}

export function ProductStockMovementsSection({ product }: ProductStockMovementsSectionProps) {
  return (
    <ProductEditorSection
      title="Movimientos de stock"
      description="Registra entradas, ventas externas, devoluciones y correcciones con historial."
    >
      <ProductStockAdjustmentPanel product={product} />
    </ProductEditorSection>
  );
}
