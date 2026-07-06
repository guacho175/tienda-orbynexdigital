import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
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
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Product) ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
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
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}