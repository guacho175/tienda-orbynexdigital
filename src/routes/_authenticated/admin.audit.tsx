import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProductAuditEvents } from "@/services/product-audit.service";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const auditQuery = useQuery({
    queryKey: ["product-audit-events"],
    queryFn: () => fetchProductAuditEvents(75),
    staleTime: 60_000,
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Auditoria"
        title="Cambios del catalogo"
        subtitle="Historial de ajustes importantes en productos e inventario."
      />
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Cambios recientes
            </CardTitle>
            <CardDescription>Snapshots antes/despues y campos modificados.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditQuery.isLoading ? (
              <p className="py-10 text-center text-muted-foreground">Cargando auditoria...</p>
            ) : auditQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                No se pudo cargar auditoria: {auditQuery.error.message}
              </div>
            ) : (
              <div className="space-y-3">
                {(auditQuery.data ?? []).map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{formatEventType(event.event_type)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.created_at)}
                          </span>
                        </div>
                        <h2 className="mt-2 font-semibold text-foreground">
                          {getSnapshotName(event.after_snapshot) ??
                            getSnapshotName(event.before_snapshot) ??
                            event.product_id}
                        </h2>
                      </div>
                      <Link
                        to="/admin/edit/$id"
                        params={{ id: event.product_id }}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Abrir producto
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.changed_fields.map((field) => (
                        <Badge key={field} variant="outline">
                          {field}
                        </Badge>
                      ))}
                      {event.changed_fields.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Sin campos modificados registrados.
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
                {(auditQuery.data ?? []).length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">
                    Todavia no hay eventos de auditoria.
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function getSnapshotName(snapshot: Json) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const value = snapshot.name;
  return typeof value === "string" ? value : null;
}

function formatEventType(value: string) {
  if (value === "product_update") return "Edicion";
  if (value === "stock_adjustment") return "Stock";
  if (value === "product_create") return "Creacion";
  return value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
