import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Price } from "@/components/ui-common/Price";
import {
  ADMIN_ORDER_STATUSES,
  fetchAdminOrders,
  type AdminOrder,
  type AdminOrderStatus,
} from "@/services/admin-orders.service";
import { formatDateTimeCL } from "@/utils/date";

const ADMIN_ORDERS_PAGE_SIZE = 20;

type StatusFilter = AdminOrderStatus | "all";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  pending: "Pendiente",
  stock_reserved: "Stock reservado",
  redirected: "Pago iniciado",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  expired: "Expirado",
  reservation_expired: "Reserva expirada",
  stock_conflict: "Revision de stock",
  requires_manual_review: "Revision manual",
};

const REVIEW_STATUSES = new Set(["stock_conflict", "requires_manual_review"]);

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", page, ADMIN_ORDERS_PAGE_SIZE, status, search, from, to],
    queryFn: () =>
      fetchAdminOrders({
        page,
        pageSize: ADMIN_ORDERS_PAGE_SIZE,
        status,
        search,
        from,
        to,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : page * ADMIN_ORDERS_PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * ADMIN_ORDERS_PAGE_SIZE);

  const visiblePaidTotal = useMemo(
    () =>
      orders
        .filter((order) => order.status === "paid")
        .reduce((sum, order) => sum + Number(order.total), 0),
    [orders],
  );
  const reviewCount = useMemo(
    () => orders.filter((order) => REVIEW_STATUSES.has(order.status)).length,
    [orders],
  );

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  function applyFilters() {
    setPage(0);
    setExpandedOrderId(null);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setPage(0);
    setExpandedOrderId(null);
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setFrom("");
    setTo("");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Ordenes y compras"
        subtitle="Consulta operativa de pedidos registrados en Supabase. Vista solo lectura."
        actions={<Badge variant="secondary">Solo lectura</Badge>}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Pedidos filtrados"
            value={total}
            detail={`${showingFrom}-${showingTo}`}
          />
          <MetricCard label="Visibles en pagina" value={orders.length} detail="Pagina actual" />
          <MetricCard
            label="Pagado visible"
            value={<Price value={visiblePaidTotal} currency="CLP" className="text-2xl" />}
            detail="Suma de ordenes pagadas visibles"
          />
          <MetricCard label="Revision" value={reviewCount} detail="Stock o revision manual" />
        </section>

        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_160px_160px_auto] lg:items-end">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Buscar
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyFilters();
                  }}
                  placeholder="Orden, correo o cliente"
                  className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Estado
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setPage(0);
                    setExpandedOrderId(null);
                    setStatus(value as StatusFilter);
                  }}
                >
                  <SelectTrigger className="border-slate-300 bg-white text-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{STATUS_LABELS.all}</SelectItem>
                    {ADMIN_ORDER_STATUSES.map((orderStatus) => (
                      <SelectItem key={orderStatus} value={orderStatus}>
                        {STATUS_LABELS[orderStatus]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Desde
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => {
                    setPage(0);
                    setFrom(event.target.value);
                  }}
                  className="border-slate-300 bg-white text-slate-950"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Hasta
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => {
                    setPage(0);
                    setTo(event.target.value);
                  }}
                  className="border-slate-300 bg-white text-slate-950"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={applyFilters} className="gap-2">
                  <Search className="h-4 w-4" />
                  Aplicar
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {ordersQuery.isLoading ? (
          <LoadingState />
        ) : ordersQuery.isError ? (
          <ErrorState message={ordersQuery.error.message} onRetry={() => ordersQuery.refetch()} />
        ) : orders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <OrdersList
            orders={orders}
            expandedOrderId={expandedOrderId}
            onToggleOrder={(orderId) =>
              setExpandedOrderId((current) => (current === orderId ? null : orderId))
            }
          />
        )}

        <OrdersPagination
          page={page}
          totalPages={totalPages}
          total={total}
          isFetching={ordersQuery.isFetching}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
        />
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | ReactNode;
  detail: string;
}) {
  return (
    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 text-3xl font-bold text-slate-950">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function OrdersList({
  orders,
  expandedOrderId,
  onToggleOrder,
}: {
  orders: AdminOrder[];
  expandedOrderId: string | null;
  onToggleOrder: (orderId: string) => void;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full min-w-[62rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderTableRows
                key={order.id}
                order={order}
                expanded={expandedOrderId === order.id}
                onToggle={() => onToggleOrder(order.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {orders.map((order) => (
          <OrderMobileCard
            key={order.id}
            order={order}
            expanded={expandedOrderId === order.id}
            onToggle={() => onToggleOrder(order.id)}
          />
        ))}
      </div>
    </>
  );
}

function OrderTableRows({
  order,
  expanded,
  onToggle,
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="px-4 py-4">
          <p className="font-semibold text-slate-950">{order.commerce_order}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.id}</p>
        </td>
        <td className="px-4 py-4">
          <p className="font-medium text-slate-950">{order.customer_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.customer_email}</p>
        </td>
        <td className="px-4 py-4">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-4 py-4 text-muted-foreground">{formatDate(order.created_at)}</td>
        <td className="px-4 py-4 text-right">
          <Price value={Number(order.total)} currency={order.currency} />
        </td>
        <td className="px-4 py-4 text-right">{getItemsCount(order)}</td>
        <td className="px-4 py-4 text-right">
          <Button type="button" variant="outline" size="sm" onClick={onToggle} className="gap-2">
            <Eye className="h-4 w-4" />
            {expanded ? "Ocultar" : "Ver"}
          </Button>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={7} className="border-t border-slate-100 bg-slate-50 px-4 py-4">
            <OrderDetail order={order} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function OrderMobileCard({
  order,
  expanded,
  onToggle,
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{order.commerce_order}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{order.customer_email}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <InfoBlock label="Fecha" value={formatDate(order.created_at)} />
        <InfoBlock label="Items" value={String(getItemsCount(order))} />
        <InfoBlock
          label="Total"
          value={<Price value={Number(order.total)} currency={order.currency} />}
        />
        <InfoBlock label="Cliente" value={order.customer_name} />
      </div>
      <Button type="button" variant="outline" className="mt-4 w-full gap-2" onClick={onToggle}>
        <Eye className="h-4 w-4" />
        {expanded ? "Ocultar detalle" : "Ver detalle"}
      </Button>
      {expanded ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <OrderDetail order={order} />
        </div>
      ) : null}
    </article>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Cliente y estado</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <InfoBlock label="Nombre" value={order.customer_name} />
          <InfoBlock label="Correo" value={order.customer_email} />
          <InfoBlock label="Telefono" value={order.customer_phone ?? "Sin telefono"} />
          <InfoBlock label="Usuario vinculado" value={order.user_id ? "Si" : "No"} />
          <InfoBlock label="Pagado" value={order.paid_at ? formatDate(order.paid_at) : "No"} />
          <InfoBlock
            label="Confirmado"
            value={order.confirmed_at ? formatDate(order.confirmed_at) : "No"}
          />
          <InfoBlock
            label="Expira"
            value={order.expires_at ? formatDate(order.expires_at) : "No"}
          />
          <InfoBlock
            label="Actualizado"
            value={order.updated_at ? formatDate(order.updated_at) : "Sin dato"}
          />
        </dl>
        {order.customer_comment ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-950">Comentario</p>
            <p className="mt-1">{order.customer_comment}</p>
          </div>
        ) : null}
        {REVIEW_STATUSES.has(order.status) ? (
          <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Esta orden requiere revision operativa antes de considerarla resuelta.
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Productos comprados</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-950">{item.product_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.product_slug}</p>
              </div>
              <p className="text-muted-foreground">x{item.quantity}</p>
              <Price value={Number(item.subtotal)} currency={item.currency} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm">
          <TotalRow label="Subtotal" value={Number(order.subtotal)} currency={order.currency} />
          <TotalRow
            label="Descuento"
            value={Number(order.discount_total)}
            currency={order.currency}
          />
          <TotalRow label="Envio" value={Number(order.shipping_total)} currency={order.currency} />
          <TotalRow label="Impuestos" value={Number(order.tax_total)} currency={order.currency} />
          <TotalRow label="Total" value={Number(order.total)} currency={order.currency} strong />
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-slate-950">{value}</dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  currency,
  strong,
}: {
  label: string;
  value: number;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-slate-950" : "text-muted-foreground"}>
        {label}
      </span>
      <Price
        value={value}
        currency={currency}
        className={strong ? "text-lg text-slate-950" : "text-slate-950"}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const needsReview = REVIEW_STATUSES.has(status);
  const paid = status === "paid";
  const failed = ["failed", "cancelled", "expired", "reservation_expired"].includes(status);

  return (
    <Badge
      variant={failed ? "destructive" : paid ? "default" : "secondary"}
      className={
        needsReview
          ? "border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-100"
          : paid
            ? "bg-emerald-600 text-white hover:bg-emerald-600"
            : undefined
      }
    >
      {STATUS_LABELS[status as StatusFilter] ?? status}
    </Badge>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-sm text-muted-foreground shadow-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      Cargando pedidos...
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>No se pudieron cargar los pedidos: {message}</p>
      </div>
      <Button type="button" variant="outline" className="mt-4 gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}

function EmptyOrdersState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
      <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold text-slate-950">Sin pedidos para estos filtros</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ajusta la busqueda, el estado o el rango de fechas para revisar otras ordenes.
      </p>
    </div>
  );
}

function OrdersPagination({
  page,
  totalPages,
  total,
  isFetching,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Pagina {page + 1} de {totalPages} - {total} pedidos
        {isFetching ? " - Actualizando..." : ""}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onPrevious} disabled={page === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <Button type="button" variant="outline" onClick={onNext} disabled={page + 1 >= totalPages}>
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getItemsCount(order: AdminOrder) {
  return order.order_items.reduce((total, item) => total + Number(item.quantity), 0);
}

const formatDate = formatDateTimeCL;
