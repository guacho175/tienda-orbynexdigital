import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  assertMethod,
  handleApiError,
  parseJsonBody,
  sendJson,
} from "../../src/server/flow/http.js";
import { createPaymentWorkflow } from "../../src/server/flow/checkout.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const payload = await parseJsonBody(req);
    const result = await createPaymentWorkflow({
      payload,
      authorizationHeader: req.headers.authorization,
    });

    sendJson(res, 200, result);
  } catch (error) {
    await handleApiError(res, error, "Could not create Flow payment");
  }
}
