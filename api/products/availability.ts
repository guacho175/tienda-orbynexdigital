import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  handleApiError,
  parseJsonBody,
  sendJson,
} from "../../src/server/flow/http.js";
import { productsAvailabilityWorkflow } from "../../src/server/flow/checkout.js";

type AvailabilityRequestBody = {
  productIds?: unknown;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PRODUCT_IDS = 100;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "POST");

    const body = (await parseJsonBody(req)) as AvailabilityRequestBody;
    const productIds = parseProductIds(body.productIds);

    if (productIds.length === 0) {
      sendJson(res, 200, { availability: [] });
      return;
    }

    const availability = await productsAvailabilityWorkflow({ productIds });

    sendJson(res, 200, { availability });
  } catch (error) {
    await handleApiError(res, error, "Could not load product availability");
  }
}

function parseProductIds(input: unknown) {
  if (!Array.isArray(input)) {
    throw new ApiError(400, "productIds must be an array");
  }

  if (input.length > MAX_PRODUCT_IDS) {
    throw new ApiError(400, `productIds cannot contain more than ${MAX_PRODUCT_IDS} ids`);
  }

  const productIds = Array.from(new Set(input));
  if (!productIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    throw new ApiError(400, "productIds must contain valid UUIDs");
  }

  return productIds as string[];
}
