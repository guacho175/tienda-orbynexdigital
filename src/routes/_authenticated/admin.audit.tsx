import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  fetchProductAuditEvents,
  getAuditChangeSummary,
  getAuditChanges,
  getAuditProductName,
} from "@/services/product-audit.service";
import { formatDateTimeCL } from "@/utils/date";

const AUDIT_PAGE_SIZE = 20;

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const [page, setPage] = useState(0);
  const auditQuery = useQuery({
    queryKey: ["product-audit-events", page, AUDIT_PAGE_SIZE],
    queryFn: () => fetchProductAuditEvents({ page, pageSize: AUDIT_PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
    staleTime: 60_000,
  });
  const total = auditQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const events = auditQuery.data?.events ?? [];
  const showingFrom = total === 0 ? 0 : page * AUDIT_PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * AUDIT_PAGE_SIZE);

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Auditoria"
        title="Cambios del catalogo"
        subtitle="Historial paginado de ajustes importantes en productos e inventario."
      />
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5" />
                Cambios recientes
              </CardTitle>
              <CardDescription>
                Cada registro muestra que cambio, con nombres y valores entendibles.
              </CardDescription>
            </div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs text-muted-foreground">
              {total === 0 ? "Sin registros" : `${showingFrom}-${showingTo} de ${total} registros`}
            </div>
          </CardHeader>
          <CardContent>
            {auditQuery.isLoading ? (
              <p className="py-10 text-center text-muted-foreground">Cargando auditoria...</p>
            ) : auditQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                No se pudo cargar auditoria: {auditQuery.error.message}
              </div>
            ) : (
              <>
                <Accordion type="multiple" className="space-y-2">
                  {events.map((event) => (
                    <AuditEventItem key={event.id} event={event} />
                  ))}
                  {events.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">
                      Todavia no hay eventos de auditoria.
                    </p>
                  ) : null}
                </Accordion>

                <AuditPagination
                  page={page}
                  totalPages={totalPages}
                  isFetching={auditQuery.isFetching}
                  onPrevious={() => setPage((current) => Math.max(0, current - 1))}
                  onNext={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AuditEventItem({
  event,
}: {
  event: Awaited<ReturnType<typeof fetchProductAuditEvents>>["events"][number];
}) {
  const changes = useMemo(() => getAuditChanges(event), [event]);
  const productName = getAuditProductName(event);

  return (
    <AccordionItem value={event.id} className="rounded-lg border border-slate-200 bg-white px-3">
      <AccordionTrigger className="gap-3 py-3 hover:no-underline">
        <div className="grid w-full gap-2 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-semibold text-foreground">{productName}</h2>
              <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {getAuditChangeSummary(event)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="secondary">{formatEventType(event.event_type)}</Badge>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
              Ver actividad
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3">
        <div className="grid gap-2 border-t border-slate-200 pt-3">
          {changes.map((change) => (
            <div
              key={change.field}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-950">{change.label}</p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                <ValueBlock label="Antes" value={change.beforeValue} />
                <span className="hidden text-muted-foreground sm:block">-&gt;</span>
                <ValueBlock label="Despues" value={change.afterValue} />
              </div>
            </div>
          ))}
          {changes.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              Sin campos modificados registrados.
            </span>
          ) : null}
          {event.product_id ? (
            <Link
              to="/admin/edit/$id"
              params={{ id: event.product_id }}
              className="mt-1 w-fit text-sm font-medium text-accent hover:underline"
            >
              Abrir producto
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Este producto ya no existe en el catalogo.
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ValueBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white px-3 py-2">
      <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-slate-950">{value}</p>
    </div>
  );
}

function AuditPagination({
  page,
  totalPages,
  isFetching,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Pagina {page + 1} de {totalPages}
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

function formatEventType(value: string) {
  if (value === "product_update") return "Edicion";
  if (value === "stock_adjustment") return "Stock";
  if (value === "product_create") return "Creacion";
  if (value === "product_delete") return "Eliminacion";
  return value;
}

const formatDate = formatDateTimeCL;
