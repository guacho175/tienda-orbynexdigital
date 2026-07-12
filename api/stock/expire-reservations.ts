import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import { assertMethod, handleApiError, sendJson } from "../../src/server/flow/http.js";
import { expireReservationsWorkflow } from "../../src/server/flow/checkout.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "GET");

    const result = await expireReservationsWorkflow({
      authorizationHeader: req.headers.authorization,
    });

    sendJson(res, 200, result);
  } catch (error) {
    await handleApiError(res, error, "Could not expire stock reservations");
  }
}
