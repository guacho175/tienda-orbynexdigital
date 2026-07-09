import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminAccessState {
  isAdmin: boolean | null;
  email: string;
}

export function useAdminAccess(): AdminAccessState {
  const [state, setState] = useState<AdminAccessState>({ isAdmin: null, email: "" });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!userData.user) {
        setState({ isAdmin: false, email: "" });
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      if (!mounted) return;
      setState({
        email: userData.user.email ?? "",
        isAdmin: (roles ?? []).some((role) => role.role === "admin"),
      });
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
