import { supabase } from "@/integrations/supabase/client";
import { commerceConfig } from "@/config/commerce.config";
import type { Product, ProductCardData } from "@/types/product";

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

type ProductAvailability = {
  productId: string;
  availableQuantity: number;
  canPurchase: boolean;
  temporarilyReserved: boolean;
};

const PRODUCT_CARD_SELECT =
  "id,name,slug,short_description,price,currency,category,image_url,image_url_thumb,image_url_card,image_url_detail,availability,stock_quantity,track_inventory,allow_backorder,low_stock_threshold,out_of_stock_behavior,payment_url,payment_button_label";

const PUBLIC_INVENTORY_FILTER =
  "track_inventory.eq.false,stock_quantity.gt.0,allow_backorder.eq.true,out_of_stock_behavior.eq.show_sold_out";

export const PRODUCTS_STALE_TIME_MS = 5 * 60 * 1000;

export type RelatedProductsInput = {
  currentProductId: string;
  category: string | null;
  limit?: number;
};

export function getRelatedProductsQueryKey({
  currentProductId,
  category,
  limit = commerceConfig.relatedProducts.limit,
}: RelatedProductsInput) {
  return [
    "products",
    "related",
    currentProductId,
    category?.trim().toLowerCase() || null,
    limit,
  ] as const;
}

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .or(PUBLIC_INVENTORY_FILTER)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return applyPublicAvailability((data ?? []) as Product[]);
}

export async function fetchFeaturedProducts(limit = 6): Promise<ProductCardData[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .or(PUBLIC_INVENTORY_FILTER)
    .order("display_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return applyPublicAvailability((data ?? []) as ProductCardData[]);
}

export async function fetchActiveProductCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
    .or(PUBLIC_INVENTORY_FILTER)
    .order("display_order", { ascending: true });
  if (error) throw error;

  return Array.from(
    new Set((data ?? []).map((product) => product.category).filter(Boolean)),
  ) as string[];
}

export async function fetchCatalogProducts(): Promise<ProductCardData[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .or(PUBLIC_INVENTORY_FILTER)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return applyPublicAvailability((data ?? []) as ProductCardData[]);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .or(PUBLIC_INVENTORY_FILTER)
    .maybeSingle();
  if (error) throw error;
  const products = await applyPublicAvailability(data ? [data as Product] : []);
  return products[0] ?? null;
}

export async function fetchRelatedProducts({
  currentProductId,
  category,
  limit = commerceConfig.relatedProducts.limit,
}: RelatedProductsInput): Promise<ProductCardData[]> {
  if (!commerceConfig.relatedProducts.enabled || limit <= 0) return [];

  const normalizedCategory = category?.trim() || null;
  const relatedProducts: ProductCardData[] = [];

  if (commerceConfig.relatedProducts.sameCategoryFirst && normalizedCategory) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("is_active", true)
      .eq("category", normalizedCategory)
      .neq("id", currentProductId)
      .or(PUBLIC_INVENTORY_FILTER)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(limit);

    if (error) throw error;
    relatedProducts.push(...((data ?? []) as ProductCardData[]));
  }

  const remainingSlots = limit - relatedProducts.length;

  if (commerceConfig.relatedProducts.fallbackAcrossCategories && remainingSlots > 0) {
    let fallbackQuery = supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("is_active", true)
      .neq("id", currentProductId)
      .or(PUBLIC_INVENTORY_FILTER)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(remainingSlots);

    const selectedIds = relatedProducts.map((product) => product.id);
    if (selectedIds.length > 0) {
      fallbackQuery = fallbackQuery.not("id", "in", `(${selectedIds.join(",")})`);
    }

    const { data, error } = await fallbackQuery;
    if (error) throw error;
    relatedProducts.push(...((data ?? []) as ProductCardData[]));
  }

  return applyPublicAvailability(relatedProducts.slice(0, limit));
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProductByIdAdmin(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Product) ?? null;
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("products").select("*").in("id", ids);
  if (error) throw error;
  return applyPublicAvailability((data ?? []) as Product[]);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from("products").insert(input).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

async function applyPublicAvailability<
  T extends {
    id: string;
    stock_quantity: number;
    track_inventory: boolean;
    allow_backorder: boolean;
  },
>(products: T[]): Promise<T[]> {
  if (products.length === 0 || typeof window === "undefined") return products;

  try {
    const response = await fetch("/api/products/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: products.map((product) => product.id) }),
    });

    if (!response.ok) return products;

    const payload = (await response.json()) as { availability?: ProductAvailability[] };
    const availabilityByProductId = new Map(
      (payload.availability ?? []).map((availability) => [availability.productId, availability]),
    );

    return products.map((product) => {
      const availability = availabilityByProductId.get(product.id);
      if (!availability || !product.track_inventory || product.allow_backorder) {
        return product;
      }

      return {
        ...product,
        stock_quantity: availability.availableQuantity,
        available_quantity: availability.availableQuantity,
        temporarily_reserved: availability.temporarilyReserved,
      };
    });
  } catch {
    return products;
  }
}
