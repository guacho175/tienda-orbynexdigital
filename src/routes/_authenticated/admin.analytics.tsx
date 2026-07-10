import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PackageSearch, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchAdminAnalytics,
  formatCurrency,
  type SalesByDateRow,
  type TopProductRow,
} from "@/services/admin-analytics.service";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const analytics = analyticsQuery.data;

  return (
    <>
      <AdminPageHeader
        eyebrow="Analitica"
        title="Indicadores comerciales"
        subtitle="Resumen de catalogo, ordenes pagadas y productos mas vendidos."
        actions={<Badge variant="secondary">Solo lectura</Badge>}
      />
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        {analyticsQuery.isLoading ? (
          <p className="py-12 text-center text-muted-foreground">Cargando analitica...</p>
        ) : analyticsQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No se pudo cargar la analitica: {analyticsQuery.error.message}
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {analytics.metrics.map((metric) => (
                <Card
                  key={metric.label}
                  className="rounded-xl border-white/10 bg-card/55 shadow-none"
                >
                  <CardHeader className="pb-2">
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="text-3xl">{metric.value}</CardTitle>
                  </CardHeader>
                  {metric.detail ? (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{metric.detail}</p>
                    </CardContent>
                  ) : null}
                </Card>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <AnalyticsTable
                icon={<ShoppingCart className="h-5 w-5" />}
                title="Ventas por fecha"
                description="Ordenes con estado pagado."
                empty="Sin ventas pagadas."
                rows={analytics.salesByDate}
                renderRow={(row) => (
                  <tr key={row.date} className="border-t border-border/50">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3 text-right">{row.orderCount}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.total)}</td>
                  </tr>
                )}
                headers={["Fecha", "Ordenes", "Total"]}
              />
              <AnalyticsTable
                icon={<PackageSearch className="h-5 w-5" />}
                title="Productos mas vendidos"
                description="Suma de items en ordenes pagadas."
                empty="Sin productos vendidos."
                rows={analytics.topProducts}
                renderRow={(row) => (
                  <tr key={row.productId} className="border-t border-border/50">
                    <td className="px-4 py-3 font-medium text-foreground">{row.productName}</td>
                    <td className="px-4 py-3 text-right">{row.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.total)}</td>
                  </tr>
                )}
                headers={["Producto", "Unidades", "Total"]}
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function AnalyticsTable<T extends SalesByDateRow | TopProductRow>({
  icon,
  title,
  description,
  headers,
  rows,
  empty,
  renderRow,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  headers: string[];
  rows: T[];
  empty: string;
  renderRow: (row: T) => ReactNode;
}) {
  return (
    <Card className="rounded-xl border-white/10 bg-card/55 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {headers.map((header, index) => (
                  <th key={header} className={index === 0 ? "px-4 py-3" : "px-4 py-3 text-right"}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(renderRow)}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {empty}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
