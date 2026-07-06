import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Loader2, RefreshCw, ShoppingBag, XCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui-common/Price";
import { useCart } from "@/store/cart.store";
import { brandConfig } from "@/config/brand.config";

type CheckoutResultSearch = {
  commerceOrder?: string;
  publicLookupToken?: string;
  lookup?: string;
  public_lookup_token?: string;
};

type OrderStatusResponse = {
  commerceOrder: string;
  status: string;
  flowStatus?: string | null;
  currency: string;
  total: number;
  paidAt?: string | null;
  confirmedAt?: string | null;
  failedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  error?: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";

export const Route = createFileRoute("/checkout/resultado")({
  validateSearch: (search: Record<string, unknown>): CheckoutResultSearch => ({
    commerceOrder: getSearchValue(search.commerceOrder),
    publicLookupToken: getSearchValue(search.publicLookupToken),
    lookup: getSearchValue(search.lookup),
    public_lookup_token: getSearchValue(search.public_lookup_token),
  }),
  head: () => ({
    meta: [{ title: `Resultado del pago - ${brandConfig.name}` }],
  }),
  component: CheckoutResultPage,
});

function CheckoutResultPage() {
  const search = Route.useSearch();
  const lookupToken = search.publicLookupToken ?? search.lookup ?? search.public_lookup_token;
  const { clear } = useCart();
  const cartClearedRef = useRef(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrderStatus = useCallback(async () => {
    if (!search.commerceOrder || !lookupToken) {
      setLoadState("error");
      setError("Faltan datos de la orden para consultar el estado del pago.");
      return;
    }

    setLoadState("loading");
    setError(null);

    try {
      const params = new URLSearchParams({
        commerceOrder: search.commerceOrder,
        publicLookupToken: lookupToken,
      });
      const response = await fetch(`/api/flow/order-status?${params.toString()}`);
      const payload = (await response.json().catch(() => ({}))) as OrderStatusResponse;

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo consultar el estado de la orden.");
      }

      setOrderStatus(payload);
      setLoadState("ready");
    } catch (loadError) {
      setLoadState("error");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo consultar el estado de la orden.",
      );
    }
  }, [lookupToken, search.commerceOrder]);

  useEffect(() => {
    void loadOrderStatus();
  }, [loadOrderStatus]);

  useEffect(() => {
    if (orderStatus?.status === "paid" && !cartClearedRef.current) {
      cartClearedRef.current = true;
      clear();
    }
  }, [clear, orderStatus?.status]);

  const displayStatus = getDisplayStatus(orderStatus?.status);
  const statusCopy = getStatusCopy(displayStatus);
  const StatusIcon = statusCopy.icon;

  return (
    <>
      <PageHeader
        title="Resultado del pago"
        subtitle="Revisamos el estado confirmado de tu orden en el sistema."
      />
      <Container className="py-12">
        <div className="card-surface mx-auto max-w-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className={statusCopy.iconClassName}>
              {loadState === "loading" ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <StatusIcon className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                {loadState === "loading" ? "Consultando" : statusCopy.label}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">
                {loadState === "loading" ? "Consultando estado de pago" : statusCopy.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{statusCopy.description}</p>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" className="mt-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>No se pudo obtener el estado</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {orderStatus ? (
            <dl className="mt-8 grid gap-4 rounded-md border border-border/60 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Orden</dt>
                <dd className="mt-1 break-all font-medium text-foreground">
                  {orderStatus.commerceOrder}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado local</dt>
                <dd className="mt-1 font-medium text-foreground">{displayStatus}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="mt-1">
                  <Price value={orderStatus.total} currency={orderStatus.currency} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado Flow</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {orderStatus.flowStatus ?? "Sin confirmar"}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={loadOrderStatus} disabled={loadState === "loading"}>
              {loadState === "loading" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-4 w-4" />
              )}
              Actualizar estado
            </Button>
            <Button asChild variant="outline">
              <Link to="/catalogo">
                <ShoppingBag className="mr-1 h-4 w-4" />
                Volver al catalogo
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}

function getSearchValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getDisplayStatus(status: string | undefined) {
  if (!status || status === "pending" || status === "redirected") return "pending";
  if (status === "paid") return "paid";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  if (status === "expired") return "expired";
  return "pending";
}

function getStatusCopy(status: ReturnType<typeof getDisplayStatus>) {
  const baseIconClassName = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full";

  if (status === "paid") {
    return {
      label: "Paid",
      title: "Pago confirmado",
      description: "Tu pago fue confirmado. El carrito se limpio automaticamente.",
      icon: CheckCircle2,
      iconClassName: `${baseIconClassName} bg-emerald-500/10 text-emerald-600`,
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      title: "Pago rechazado",
      description:
        "La orden no fue pagada. El carrito se mantiene para que puedas intentar otra vez.",
      icon: XCircle,
      iconClassName: `${baseIconClassName} bg-destructive/10 text-destructive`,
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      title: "Pago cancelado",
      description: "La orden fue cancelada. El carrito se mantiene sin cambios.",
      icon: XCircle,
      iconClassName: `${baseIconClassName} bg-destructive/10 text-destructive`,
    };
  }

  if (status === "expired") {
    return {
      label: "Expired",
      title: "Pago expirado",
      description: "La orden expiro antes de completarse. El carrito se mantiene sin cambios.",
      icon: XCircle,
      iconClassName: `${baseIconClassName} bg-destructive/10 text-destructive`,
    };
  }

  return {
    label: "Pending",
    title: "Pago pendiente",
    description:
      "Aun no hay confirmacion definitiva de Flow. Puedes actualizar esta pagina en unos segundos.",
    icon: Clock3,
    iconClassName: `${baseIconClassName} bg-amber-500/10 text-amber-600`,
  };
}
