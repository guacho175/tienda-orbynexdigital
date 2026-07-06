import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

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