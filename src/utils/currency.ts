export function formatCurrency(
  value: number,
  currency = "CLP",
  locale = "es-CL",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "CLP" ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}