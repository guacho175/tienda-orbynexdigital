import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import { ApiError, assertMethod, handleApiError, sendJson } from "../../src/server/flow/http.js";
import { getSupabaseServerEnv } from "../../src/server/flow/env.js";
import { createSupabaseAdmin } from "../../src/server/flow/supabase.js";

type LinkOrdersRpcResult = {
  linked_orders?: number;
};

type ConfirmableUser = {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || Array.isArray(authorizationHeader)) {
      throw new ApiError(401, "Necesitas iniciar sesion para cargar tus pedidos.");
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new ApiError(401, "Sesion invalida.");
    }

    const env = getSupabaseServerEnv();
    const supabase = createSupabaseAdmin(env);
    const { data: authData, error: authError } = await supabase.auth.getUser(match[1]);
    const tokenUser = authData.user;

    if (authError || !tokenUser?.id) {
      throw new ApiError(401, "Sesion invalida.");
    }

    const { data: adminData, error: adminError } = await supabase.auth.admin.getUserById(
      tokenUser.id,
    );
    const user = adminData.user;

    if (adminError || !user?.email) {
      throw new ApiError(401, "Sesion invalida.");
    }

    if (!isEmailConfirmed(user)) {
      throw new ApiError(403, "Confirma tu correo antes de cargar pedidos anteriores.");
    }

    const { data, error } = await supabase.rpc("link_guest_orders_to_user", {
      p_user_id: user.id,
      p_email: user.email,
    });

    if (error) {
      throw new ApiError(500, "No se pudieron asociar tus pedidos.");
    }

    const result = Array.isArray(data)
      ? (data[0] as LinkOrdersRpcResult | undefined)
      : (data as LinkOrdersRpcResult | undefined);

    sendJson(res, 200, {
      linkedOrders: result?.linked_orders ?? 0,
    });
  } catch (error) {
    await handleApiError(res, error, "Could not link account orders");
  }
}

function isEmailConfirmed(user: ConfirmableUser) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}
