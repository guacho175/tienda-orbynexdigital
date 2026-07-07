import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductCardData } from "@/types/product";

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

const PRODUCT_CARD_SELECT =
  "id,name,slug,short_description,price,currency,category,image_url,image_url_thumb,image_url_card,image_url_detail,payment_url,payment_button_label";

export const PRODUCTS_STALE_TIME_MS = 5 * 60 * 1000;

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchFeaturedProducts(limit = 6): Promise<ProductCardData[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductCardData[];
}

export async function fetchActiveProductCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
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
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductCardData[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as Product) ?? null;
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
