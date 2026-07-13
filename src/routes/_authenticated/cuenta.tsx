import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, LogOut, PackageSearch, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Price } from "@/components/ui-common/Price";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { accountConfig } from "@/config/account.config";
import {
  fetchCurrentUserOrders,
  linkGuestOrdersToCurrentUser,
  type AccountOrder,
} from "@/services/account-orders.service";
import { brandConfig } from "@/config/brand.config";
import { getAdminAccess } from "@/services/admin-access.service";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTimeCL } from "@/utils/date";

type ConfirmableUser = {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export const Route = createFileRoute("/_authenticated/cuenta")({
  head: () => ({
    meta: [{ title: `${accountConfig.dashboard.title} - ${brandConfig.name}` }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const emailConfirmed = isEmailConfirmed(user);

  const adminAccessQuery = useQuery({
    queryKey: ["admin-access", user.id],
    queryFn: () => getAdminAccess(user.id),
    staleTime: 60_000,
    retry: 1,
  });

  const ordersQuery = useQuery({
    queryKey: ["account-orders", user.id],
    queryFn: async () => {
      await linkGuestOrdersToCurrentUser().catch(() => null);
      return fetchCurrentUserOrders();
    },
    enabled: emailConfirmed,
    staleTime: 30_000,
    retry: 1,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <>
      <PageHeader
        title={accountConfig.dashboard.title}
        subtitle={accountConfig.dashboard.subtitle}
      />
      <Container className="py-8 sm:py-12">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="orders" className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-auto rounded-full border border-white/8 bg-white/5 p-1">
                <TabsTrigger value="profile" className="rounded-full px-4 py-2">
                  <User className="mr-2 h-4 w-4" />
                  {accountConfig.dashboard.menu.profile}
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-full px-4 py-2">
                  <PackageSearch className="mr-2 h-4 w-4" />
                  {accountConfig.dashboard.menu.orders}
                </TabsTrigger>
              </TabsList>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full sm:w-auto"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {accountConfig.dashboard.menu.signOut}
              </Button>
            </div>

            <TabsContent value="profile" className="mt-8">
              <ProfilePanel
                email={user.email ?? ""}
                emailConfirmed={emailConfirmed}
                isAdmin={adminAccessQuery.data === true}
              />
            </TabsContent>

            <TabsContent value="orders" className="mt-8">
              <OrdersPanel emailConfirmed={emailConfirmed} ordersQuery={ordersQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </>
  );
}

function ProfilePanel({
  email,
  emailConfirmed,
  isAdmin,
}: {
  email: string;
  emailConfirmed: boolean;
  isAdmin: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {accountConfig.dashboard.profile.title}
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">{accountConfig.dashboard.profile.emailLabel}</p>
            <p className="mt-1 font-medium text-foreground">{email}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
            {emailConfirmed ? (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            ) : (
              <AlertCircle className="h-4 w-4 text-accent" />
            )}
            {emailConfirmed
              ? accountConfig.dashboard.profile.emailConfirmed
              : accountConfig.dashboard.profile.emailPending}
          </div>
          {isAdmin ? (
            <Button asChild className="mt-1 rounded-full">
              <Link to="/admin">{accountConfig.dashboard.profile.adminPanelButton}</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5 text-sm text-muted-foreground">
        {accountConfig.dashboard.profile.roleNote}
      </div>
    </section>
  );
}

function OrdersPanel({
  emailConfirmed,
  ordersQuery,
}: {
  emailConfirmed: boolean;
  ordersQuery: ReturnType<typeof useQuery<AccountOrder[], Error>>;
}) {
  if (!emailConfirmed) {
    return (
      <Alert className="border-accent/30 bg-accent/10 text-foreground">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{accountConfig.dashboard.unconfirmedTitle}</AlertTitle>
        <AlertDescription>{accountConfig.dashboard.unconfirmedDescription}</AlertDescription>
      </Alert>
    );
  }

  if (ordersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {accountConfig.dashboard.loadingOrders}
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
        <p className="text-sm text-destructive">
          {ordersQuery.error instanceof Error
            ? ordersQuery.error.message
            : accountConfig.dashboard.fallbackLoadError}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => ordersQuery.refetch()}
        >
          {accountConfig.dashboard.retry}
        </Button>
      </div>
    );
  }

  if (!ordersQuery.data || ordersQuery.data.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch className="h-10 w-10" />}
        title={accountConfig.dashboard.emptyTitle}
        description={accountConfig.dashboard.emptyDescription}
        action={
          <Button asChild className="btn-hero rounded-full">
            <Link to="/catalogo">{accountConfig.dashboard.browseProducts}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {ordersQuery.data.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: AccountOrder }) {
  const createdAt = formatDate(order.created_at);
  const paidAt = order.paid_at ? formatDate(order.paid_at) : null;

  return (
    <article className="card-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {accountConfig.dashboard.orderLabel}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{order.commerce_order}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {accountConfig.dashboard.createdAtLabel}: {createdAt}
            </span>
            {paidAt ? (
              <span>
                {accountConfig.dashboard.paidAtLabel}: {paidAt}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Badge variant="secondary">{getStatusLabel(order.status)}</Badge>
          <Price value={Number(order.total)} currency={order.currency} className="text-xl" />
        </div>
      </div>

      <div className="mt-5 border-t border-white/8 pt-4">
        <p className="text-sm font-medium text-foreground">{accountConfig.dashboard.itemsLabel}</p>
        <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <span>
                {item.product_name} x{item.quantity}
              </span>
              <Price value={Number(item.subtotal)} currency={item.currency} />
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function getStatusLabel(status: string) {
  return (
    accountConfig.dashboard.statusLabels[
      status as keyof typeof accountConfig.dashboard.statusLabels
    ] ?? status
  );
}

const formatDate = formatDateTimeCL;

function isEmailConfirmed(user: ConfirmableUser) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}
