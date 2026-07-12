import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  getQueryParam,
  handleApiError,
  sendJson,
} from "../../src/server/flow/http.js";
import { orderStatusWorkflow } from "../../src/server/flow/checkout.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "GET");

    const commerceOrder = getQueryParam(req, "commerceOrder");
    const publicLookupToken =
      getQueryParam(req, "publicLookupToken") ??
      getQueryParam(req, "lookup") ??
      getQueryParam(req, "public_lookup_token");

    if (!commerceOrder || !publicLookupToken) {
      throw new ApiError(400, "Missing commerceOrder or publicLookupToken");
    }

    const result = await orderStatusWorkflow({
      commerceOrder,
      publicLookupToken,
    });

    sendJson(res, 200, result);
  } catch (error) {
    await handleApiError(res, error, "Could not load order status");
  }
}
