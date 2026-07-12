import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  getQueryParam,
  handleApiError,
  parseFormBody,
  sendJson,
} from "../../src/server/flow/http.js";
import { confirmPaymentWorkflow } from "../../src/server/flow/checkout.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const formBody = await parseFormBody(req);
    const token = formBody.token || getQueryParam(req, "token");

    if (!token) {
      throw new ApiError(400, "Missing Flow token");
    }

    const result = await confirmPaymentWorkflow({ token });

    sendJson(res, 200, result);
  } catch (error) {
    await handleApiError(res, error, "Could not confirm Flow payment");
  }
}
