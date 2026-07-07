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
  | "available_quantity"
  | "temporarily_reserved"
>;

export type InventoryCardProduct = Pick<
  ProductCardData,
  | "availability"
  | "stock_quantity"
  | "track_inventory"
  | "allow_backorder"
  | "low_stock_threshold"
  | "out_of_stock_behavior"
  | "available_quantity"
  | "temporarily_reserved"
>;

export interface CartInventoryIssue {
  productId: string;
  message: string;
  availableQuantity: number;
  canAdjust: boolean;
}

export const TEMPORARILY_RESERVED_MESSAGE =
  "Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos.";

export function getAvailableQuantity(product: InventoryCardProduct) {
  return Number(product.available_quantity ?? product.stock_quantity) || 0;
}

export function isTemporarilyReserved(product: InventoryCardProduct) {
  return Boolean(product.temporarily_reserved);
}

export function isSoldOut(product: InventoryCardProduct) {
  if (product.availability === "out_of_stock") return true;
  return (
    !isTemporarilyReserved(product) &&
    product.track_inventory &&
    !product.allow_backorder &&
    getAvailableQuantity(product) <= 0
  );
}

export function isLowStock(product: InventoryCardProduct) {
  return (
    product.track_inventory &&
    !product.allow_backorder &&
    getAvailableQuantity(product) > 0 &&
    getAvailableQuantity(product) <= Number(product.low_stock_threshold)
  );
}

export function canPurchase(product: InventoryCardProduct, quantity = 1) {
  if (product.availability === "out_of_stock") return false;
  if (!product.track_inventory || product.allow_backorder) return true;
  return getAvailableQuantity(product) >= quantity;
}

export function isHiddenByStock(product: InventoryCardProduct) {
  return (
    !isTemporarilyReserved(product) &&
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
      const availableQuantity = Math.max(0, getAvailableQuantity(product));
      return [
        {
          productId: item.productId,
          message:
            product.temporarily_reserved && availableQuantity === 0
              ? TEMPORARILY_RESERVED_MESSAGE
              : availableQuantity > 0
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
