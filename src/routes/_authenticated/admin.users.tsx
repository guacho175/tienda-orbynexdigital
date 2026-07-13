import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundSearch,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

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
import { brandConfig } from "@/config/brand.config";
import {
  fetchAdminUsers,
  type AdminUserRow,
  type AdminUserRole,
  type AdminUsersBooleanFilter,
} from "@/services/admin-users.service";

const ADMIN_USERS_PAGE_SIZE = 20;

type RoleFilter = AdminUserRole | "all";

const ROLE_LABELS: Record<RoleFilter, string> = {
  all: "Todos",
  admin: "Administrador",
  user: "Cliente",
};

const BOOLEAN_LABELS: Record<AdminUsersBooleanFilter, string> = {
  all: "Todos",
  yes: "Si",
  no: "No",
};

const STATUS_LABELS: Record<string, string> = {
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

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [emailConfirmed, setEmailConfirmed] = useState<AdminUsersBooleanFilter>("all");
  const [hasPurchases, setHasPurchases] = useState<AdminUsersBooleanFilter>("all");
  const [needsReview, setNeedsReview] = useState<AdminUsersBooleanFilter>("all");
  const [staleRedirected, setStaleRedirected] = useState<AdminUsersBooleanFilter>("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: [
      "admin-users",
      page,
      ADMIN_USERS_PAGE_SIZE,
      search,
      role,
      emailConfirmed,
      hasPurchases,
      needsReview,
      staleRedirected,
    ],
    queryFn: () =>
      fetchAdminUsers({
        page,
        pageSize: ADMIN_USERS_PAGE_SIZE,
        search,
        role,
        emailConfirmed,
        hasPurchases,
        needsReview,
        staleRedirected,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : page * ADMIN_USERS_PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * ADMIN_USERS_PAGE_SIZE);
  const staleWindow = usersQuery.data?.staleRedirectedMinutes ?? 30;
  const scanLimitReached =
    Boolean(usersQuery.data?.scanLimit) &&
    usersQuery.data?.scannedUsers === usersQuery.data?.scanLimit;

  const visibleMetrics = useMemo(
    () => ({
      buyers: users.filter((user) => user.orders.paid > 0).length,
      paidTotal: users.reduce((sum, user) => sum + user.orders.totalPaid, 0),
      staleRedirected: users.reduce((sum, user) => sum + user.orders.staleRedirected, 0),
      review: users.reduce((sum, user) => sum + user.orders.review, 0),
    }),
    [users],
  );

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  function applyFilters() {
    setPage(0);
    setExpandedUserId(null);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setPage(0);
    setExpandedUserId(null);
    setSearchInput("");
    setSearch("");
    setRole("all");
    setEmailConfirmed("all");
    setHasPurchases("all");
    setNeedsReview("all");
    setStaleRedirected("all");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Clientes"
        title="Usuarios y compras"
        subtitle="Consulta segura de usuarios Auth con compras vinculadas por cuenta o correo."
        actions={<Badge variant="secondary">Solo lectura</Badge>}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Usuarios filtrados"
            value={total}
            detail={`${showingFrom}-${showingTo}`}
          />
          <MetricCard
            label="Compradores visibles"
            value={visibleMetrics.buyers}
            detail="Pagina actual"
          />
          <MetricCard
            label="Pagado visible"
            value={<Price value={visibleMetrics.paidTotal} currency="CLP" className="text-2xl" />}
            detail="Compras pagadas visibles"
          />
          <MetricCard
            label="Pago iniciado antiguo"
            value={visibleMetrics.staleRedirected}
            detail={`Mas de ${staleWindow} min`}
          />
        </section>

        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_170px_170px_170px_190px_auto] xl:items-end">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Buscar
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyFilters();
                  }}
                  placeholder="Correo, nombre u orden"
                  className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                />
              </label>

              <FilterSelect
                label="Rol"
                value={role}
                onValueChange={(value) => {
                  setPage(0);
                  setExpandedUserId(null);
                  setRole(value as RoleFilter);
                }}
                options={ROLE_LABELS}
              />

              <FilterSelect
                label="Correo confirmado"
                value={emailConfirmed}
                onValueChange={(value) => {
                  setPage(0);
                  setExpandedUserId(null);
                  setEmailConfirmed(value as AdminUsersBooleanFilter);
                }}
                options={BOOLEAN_LABELS}
              />

              <FilterSelect
                label="Ha comprado"
                value={hasPurchases}
                onValueChange={(value) => {
                  setPage(0);
                  setExpandedUserId(null);
                  setHasPurchases(value as AdminUsersBooleanFilter);
                }}
                options={BOOLEAN_LABELS}
              />

              <FilterSelect
                label="Revision"
                value={needsReview}
                onValueChange={(value) => {
                  setPage(0);
                  setExpandedUserId(null);
                  setNeedsReview(value as AdminUsersBooleanFilter);
                }}
                options={BOOLEAN_LABELS}
              />

              <FilterSelect
                label="Pago iniciado antiguo"
                value={staleRedirected}
                onValueChange={(value) => {
                  setPage(0);
                  setExpandedUserId(null);
                  setStaleRedirected(value as AdminUsersBooleanFilter);
                }}
                options={BOOLEAN_LABELS}
              />

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
            {scanLimitReached ? (
              <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Los filtros avanzados revisaron el limite inicial de usuarios. Si la base crece,
                conviene migrar esta busqueda a una tabla de perfiles indexada.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {usersQuery.isLoading ? (
          <LoadingState />
        ) : usersQuery.isError ? (
          <ErrorState message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} />
        ) : users.length === 0 ? (
          <EmptyUsersState />
        ) : (
          <UsersList
            users={users}
            expandedUserId={expandedUserId}
            onToggleUser={(userId) =>
              setExpandedUserId((current) => (current === userId ? null : userId))
            }
          />
        )}

        <UsersPagination
          page={page}
          totalPages={totalPages}
          total={total}
          isFetching={usersQuery.isFetching}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
        />
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Record<string, string>;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-slate-300 bg-white text-slate-950">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([optionValue, label]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
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

function UsersList({
  users,
  expandedUserId,
  onToggleUser,
}: {
  users: AdminUserRow[];
  expandedUserId: string | null;
  onToggleUser: (userId: string) => void;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full min-w-[68rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3 text-right">Compras</th>
              <th className="px-4 py-3 text-right">Pagado</th>
              <th className="px-4 py-3 text-right">Alertas</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserTableRows
                key={user.id}
                user={user}
                expanded={expandedUserId === user.id}
                onToggle={() => onToggleUser(user.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {users.map((user) => (
          <UserMobileCard
            key={user.id}
            user={user}
            expanded={expandedUserId === user.id}
            onToggle={() => onToggleUser(user.id)}
          />
        ))}
      </div>
    </>
  );
}

function UserTableRows({
  user,
  expanded,
  onToggle,
}: {
  user: AdminUserRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="px-4 py-4">
          <p className="font-semibold text-slate-950">{user.displayName ?? user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
        </td>
        <td className="px-4 py-4">
          <RoleBadge role={user.role} />
          <div className="mt-2">
            <EmailBadge confirmed={user.emailConfirmed} />
          </div>
        </td>
        <td className="px-4 py-4 text-muted-foreground">
          <p>{formatDate(user.createdAt)}</p>
          <p className="mt-1 text-xs">
            Ultimo acceso {user.lastSignInAt ? formatDate(user.lastSignInAt) : "sin dato"}
          </p>
        </td>
        <td className="px-4 py-4 text-right">
          <p className="font-semibold text-slate-950">{user.orders.total}</p>
          <p className="text-xs text-muted-foreground">{user.orders.paid} pagadas</p>
        </td>
        <td className="px-4 py-4 text-right">
          <Price value={user.orders.totalPaid} currency={user.orders.currency} />
        </td>
        <td className="px-4 py-4 text-right">
          <AlertBadges user={user} />
        </td>
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
            <UserDetail user={user} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function UserMobileCard({
  user,
  expanded,
  onToggle,
}: {
  user: AdminUserRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{user.displayName ?? user.email}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <InfoBlock label="Registro" value={formatDate(user.createdAt)} />
        <InfoBlock label="Compras" value={`${user.orders.total} (${user.orders.paid} pagadas)`} />
        <InfoBlock
          label="Pagado"
          value={<Price value={user.orders.totalPaid} currency={user.orders.currency} />}
        />
        <InfoBlock label="Correo" value={user.emailConfirmed ? "Confirmado" : "Pendiente"} />
      </div>
      <div className="mt-4">
        <AlertBadges user={user} />
      </div>
      <Button type="button" variant="outline" className="mt-4 w-full gap-2" onClick={onToggle}>
        <Eye className="h-4 w-4" />
        {expanded ? "Ocultar detalle" : "Ver detalle"}
      </Button>
      {expanded ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <UserDetail user={user} />
        </div>
      ) : null}
    </article>
  );
}

function UserDetail({ user }: { user: AdminUserRow }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Cuenta</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <InfoBlock label="Nombre inferido" value={user.displayName ?? "Sin compras"} />
          <InfoBlock label="Correo" value={user.email} />
          <InfoBlock label="Rol" value={ROLE_LABELS[user.role]} />
          <InfoBlock
            label="Correo confirmado"
            value={user.emailConfirmedAt ? formatDate(user.emailConfirmedAt) : "No"}
          />
          <InfoBlock label="Registrado" value={formatDate(user.createdAt)} />
          <InfoBlock
            label="Ultimo acceso"
            value={user.lastSignInAt ? formatDate(user.lastSignInAt) : "Sin dato"}
          />
          <InfoBlock
            label="Compras invitadas"
            value={`${user.orders.guestMatched} por correo exacto`}
          />
          <InfoBlock
            label="Ultima compra"
            value={user.orders.lastOrderAt ? formatDate(user.orders.lastOrderAt) : "Sin compras"}
          />
        </dl>

        {user.orders.staleRedirected > 0 ? (
          <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Este usuario tiene pagos iniciados antiguos. Antes de migrar/cancelar, hay que consultar
            Flow por token y solo cerrar los que no tengan confirmacion de pago.
          </div>
        ) : null}

        <Button asChild variant="outline" className="mt-4 gap-2">
          <Link to="/admin/orders">
            Revisar pedidos
            <Search className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Ultimas ordenes</h2>
        {user.orders.latest.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay compras asociadas a este usuario.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {user.orders.latest.map((order) => (
              <div
                key={order.id}
                className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{order.commerceOrder}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-start justify-start gap-2 sm:justify-end">
                  <StatusBadge status={order.status} stale={order.staleRedirected} />
                  {order.guestMatched ? <Badge variant="secondary">Invitado</Badge> : null}
                </div>
                <Price value={order.total} currency={order.currency} />
              </div>
            ))}
          </div>
        )}
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

function RoleBadge({ role }: { role: AdminUserRole }) {
  return (
    <Badge
      variant={role === "admin" ? "default" : "secondary"}
      className={role === "admin" ? "bg-slate-950 text-white hover:bg-slate-950" : undefined}
    >
      {role === "admin" ? <ShieldCheck className="mr-1 h-3.5 w-3.5" /> : null}
      {ROLE_LABELS[role]}
    </Badge>
  );
}

function EmailBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <Badge variant={confirmed ? "secondary" : "outline"}>
      {confirmed ? "Correo confirmado" : "Correo pendiente"}
    </Badge>
  );
}

function StatusBadge({ status, stale }: { status: string; stale: boolean }) {
  const paid = status === "paid";
  const failed = ["failed", "cancelled", "expired", "reservation_expired"].includes(status);

  return (
    <Badge
      variant={failed ? "destructive" : paid ? "default" : "secondary"}
      className={
        stale
          ? "border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-100"
          : paid
            ? "bg-emerald-600 text-white hover:bg-emerald-600"
            : undefined
      }
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function AlertBadges({ user }: { user: AdminUserRow }) {
  if (user.orders.review === 0 && user.orders.staleRedirected === 0 && user.orders.failed === 0) {
    return <span className="text-xs text-muted-foreground">Sin alertas</span>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {user.orders.staleRedirected > 0 ? (
        <Badge className="border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-100">
          {user.orders.staleRedirected} pago iniciado
        </Badge>
      ) : null}
      {user.orders.review > 0 ? (
        <Badge variant="secondary">{user.orders.review} revision</Badge>
      ) : null}
      {user.orders.failed > 0 ? (
        <Badge variant="destructive">{user.orders.failed} cerradas</Badge>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-sm text-muted-foreground shadow-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      Cargando usuarios...
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>No se pudieron cargar los usuarios: {message}</p>
      </div>
      <Button type="button" variant="outline" className="mt-4 gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}

function EmptyUsersState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
      <UserRoundSearch className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold text-slate-950">Sin usuarios para estos filtros</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ajusta la busqueda, rol o criterios de compras para revisar otros clientes.
      </p>
    </div>
  );
}

function UsersPagination({
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
        Pagina {page + 1} de {totalPages} - {total} usuarios
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(brandConfig.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
