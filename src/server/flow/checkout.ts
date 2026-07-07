import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "./http.js";
import type { ProductRow } from "./supabase.js";

export const createPaymentBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional().nullable(),
    comment: z.string().trim().max(1000).optional().nullable(),
  }),
});

export type CreatePaymentBody = z.infer<typeof createPaymentBodySchema>;

export interface CalculatedOrderItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  currency: string;
}

export interface CalculatedOrder {
  items: CalculatedOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
}

export function parseCreatePaymentBody(input: unknown): CreatePaymentBody {
  const result = createPaymentBodySchema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, "Invalid checkout payload");
  }
  return result.data;
}

export function aggregateRequestedItems(items: CreatePaymentBody["items"]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  for (const quantity of quantities.values()) {
    if (quantity > 99) {
      throw new ApiError(400, "Invalid product quantity");
    }
  }

  return quantities;
}

export function calculateOrder(
  requestedItems: Map<string, number>,
  products: ProductRow[],
): CalculatedOrder {
  const productsById = new Map(products.map((product) => [product.id, product]));

  if (productsById.size !== requestedItems.size) {
    throw new ApiError(400, "One or more products do not exist");
  }

  const calculatedItems: CalculatedOrderItem[] = [];

  for (const [productId, quantity] of requestedItems) {
    const product = productsById.get(productId);
    if (!product) throw new ApiError(400, "Product not found");
    if (!product.is_active) throw new ApiError(409, "Product is not active");
    if (product.availability === "out_of_stock") {
      throw new ApiError(409, `${product.name} esta agotado.`);
    }
    if (product.track_inventory && !product.allow_backorder && product.stock_quantity <= 0) {
      throw new ApiError(409, `${product.name} esta agotado.`);
    }
    if (product.track_inventory && !product.allow_backorder && quantity > product.stock_quantity) {
      throw new ApiError(
        409,
        `${product.name} no tiene stock suficiente. Stock disponible: ${product.stock_quantity}.`,
      );
    }
    if (product.currency !== "CLP") {
      throw new ApiError(409, "Only CLP products are supported for Flow checkout");
    }

    const unitPrice = toMoney(product.price);
    const subtotal = toMoney(unitPrice * quantity);

    calculatedItems.push({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      unit_price: unitPrice,
      quantity,
      subtotal,
      currency: product.currency,
    });
  }

  const subtotal = toMoney(calculatedItems.reduce((sum, item) => sum + item.subtotal, 0));

  if (subtotal <= 0) {
    throw new ApiError(400, "Order total must be greater than zero");
  }

  if (!Number.isInteger(subtotal)) {
    throw new ApiError(409, "CLP Flow payments require an integer amount");
  }

  return {
    items: calculatedItems,
    subtotal,
    total: subtotal,
    currency: "CLP",
  };
}

export function buildCommerceOrder(): string {
  const random = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `ORD-${Date.now()}-${random}`;
}

function toMoney(value: number | string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ApiError(409, "Invalid product price");
  }
  return Math.round(numeric * 100) / 100;
}
