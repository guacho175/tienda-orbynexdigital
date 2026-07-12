import { commerceConfig } from "@/config/commerce.config";

export function formatCurrency(
  value: number,
  currency = commerceConfig.currency,
  locale = commerceConfig.locale,
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
