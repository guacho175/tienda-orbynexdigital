import { formatCurrency } from "@/utils/currency";
import { commerceConfig } from "@/config/commerce.config";
import { cn } from "@/lib/utils";

export function Price({
  value,
  currency,
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const c = currency ?? commerceConfig.currency;
  return (
    <span className={cn("font-semibold text-foreground", className)}>
      {formatCurrency(value, c, commerceConfig.locale)}
    </span>
  );
}