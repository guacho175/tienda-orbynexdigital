type ErrorLike = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
};

const PRODUCT_ERROR_MESSAGES = {
  duplicateSlug:
    "Ya existe un producto con esa direccion publica. Cambia el nombre o abre la seccion SEO y modifica la direccion del producto.",
  fallback: "Revisa los campos e intenta nuevamente.",
} as const;

function readErrorText(error: ErrorLike) {
  return [error.code, error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

export function getProductSaveErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return PRODUCT_ERROR_MESSAGES.fallback;
  }

  const errorText = readErrorText(error as ErrorLike);

  if (
    errorText.includes("23505") ||
    errorText.includes("products_slug_key") ||
    (errorText.includes("duplicate key") && errorText.includes("slug"))
  ) {
    return PRODUCT_ERROR_MESSAGES.duplicateSlug;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return PRODUCT_ERROR_MESSAGES.fallback;
}
