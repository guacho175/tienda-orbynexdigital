import { supabase } from "@/integrations/supabase/client";

export async function getAdminAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.role === "admin";
}
