import type { CartItem } from "@/types/cart";
import type { Product, ProductCardData } from "@/types/product";

export type InventoryProduct = Pick<
  Product,
  | "id"
  | "name"
  | "is_active"
  | "availability"
  | "stock_quantity"
  | "track_inventory"
  | "allow_backorder"
  | "low_stock_threshold"
  | "out_of_stock_behavior"
>;

export type InventoryCardProduct = Pick<
  ProductCardData,
  | "availability"
  | "stock_quantity"
  | "track_inventory"
  | "allow_backorder"
  | "low_stock_threshold"
  | "out_of_stock_behavior"
>;

export interface CartInventoryIssue {
  productId: string;
  message: string;
  availableQuantity: number;
  canAdjust: boolean;
}

export function isSoldOut(product: InventoryCardProduct) {
  if (product.availability === "out_of_stock") return true;
  return product.track_inventory && !product.allow_backorder && Number(product.stock_quantity) <= 0;
}

export function isLowStock(product: InventoryCardProduct) {
  return (
    product.track_inventory &&
    !product.allow_backorder &&
    Number(product.stock_quantity) > 0 &&
    Number(product.stock_quantity) <= Number(product.low_stock_threshold)
  );
}

export function canPurchase(product: InventoryCardProduct, quantity = 1) {
  if (product.availability === "out_of_stock") return false;
  if (!product.track_inventory || product.allow_backorder) return true;
  return Number(product.stock_quantity) >= quantity;
}

export function isHiddenByStock(product: InventoryCardProduct) {
  return (
    product.track_inventory &&
    !product.allow_backorder &&
    Number(product.stock_quantity) <= 0 &&
    product.out_of_stock_behavior === "hide_product"
  );
}

export function getCartInventoryIssues(
  items: CartItem[],
  latestProducts: Product[] | undefined,
): CartInventoryIssue[] {
  if (!latestProducts) return [];

  const productsById = new Map(latestProducts.map((product) => [product.id, product]));

  return items.flatMap((item) => {
    const product = productsById.get(item.productId);

    if (!product || !product.is_active || isHiddenByStock(product)) {
      return [
        {
          productId: item.productId,
          message: `${item.name} ya no esta disponible.`,
          availableQuantity: 0,
          canAdjust: false,
        },
      ];
    }

    if (!canPurchase(product, item.quantity)) {
      const availableQuantity = Math.max(0, Number(product.stock_quantity) || 0);
      return [
        {
          productId: item.productId,
          message:
            availableQuantity > 0
              ? `${item.name} solo tiene ${availableQuantity} unidades disponibles.`
              : `${item.name} esta agotado.`,
          availableQuantity,
          canAdjust: availableQuantity > 0,
        },
      ];
    }

    return [];
  });
}
