import { commerceConfig } from "@/config/commerce.config";
import { formatCurrency } from "./currency";
import type { CartItem } from "@/types/cart";

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  comment?: string;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsappCheckoutUrl(
  items: CartItem[],
  customer: CheckoutCustomer,
  total: number,
  currency: string,
  locale: string,
): string {
  const lines: string[] = [];
  lines.push(commerceConfig.whatsappCheckout.defaultMessage);
  lines.push("");
  lines.push(`Cliente: ${customer.name}`);
  lines.push(`Email: ${customer.email}`);
  lines.push(`Telefono: ${customer.phone}`);
  lines.push("");
  lines.push("Productos:");
  for (const item of items) {
    const subtotal = item.price * item.quantity;
    lines.push(
      `- ${item.name} x${item.quantity} — ${formatCurrency(subtotal, item.currency, locale)}`,
    );
  }
  lines.push("");
  lines.push(`Total: ${formatCurrency(total, currency, locale)}`);
  if (customer.comment) {
    lines.push("");
    lines.push(`Comentario: ${customer.comment}`);
  }

  const text = encodeURIComponent(lines.join("\n"));
  const phone = sanitizePhone(commerceConfig.whatsappCheckout.phone);
  return `https://wa.me/${phone}?text=${text}`;
}

export function buildWhatsappContactUrl(message?: string): string {
  const phone = sanitizePhone(commerceConfig.whatsappCheckout.phone);
  const text = encodeURIComponent(message ?? "Hola, quiero más información.");
  return `https://wa.me/${phone}?text=${text}`;
}