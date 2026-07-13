import { supabase } from "@/integrations/supabase/client";

export type AdminUserRole = "admin" | "user";
export type AdminUsersBooleanFilter = "all" | "yes" | "no";

export interface AdminUserLatestOrder {
  id: string;
  commerceOrder: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  staleRedirected: boolean;
  guestMatched: boolean;
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: AdminUserRole;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  emailConfirmed: boolean;
  displayName: string | null;
  orders: {
    total: number;
    paid: number;
    failed: number;
    review: number;
    redirected: number;
    staleRedirected: number;
    guestMatched: number;
    totalPaid: number;
    currency: string;
    lastOrderAt: string | null;
    latest: AdminUserLatestOrder[];
  };
}

export interface FetchAdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: AdminUserRole | "all";
  emailConfirmed?: AdminUsersBooleanFilter;
  hasPurchases?: AdminUsersBooleanFilter;
  needsReview?: AdminUsersBooleanFilter;
  staleRedirected?: AdminUsersBooleanFilter;
}

export interface AdminUsersResult {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  scannedUsers: number;
  scanLimit: number | null;
  staleRedirectedMinutes: number;
}

export async function fetchAdminUsers({
  page = 0,
  pageSize = 20,
  search,
  role = "all",
  emailConfirmed = "all",
  hasPurchases = "all",
  needsReview = "all",
  staleRedirected = "all",
}: FetchAdminUsersParams = {}): Promise<AdminUsersResult> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("Sesion invalida.");
  }

  const params = new URLSearchParams({
    page: String(Math.max(0, page)),
    pageSize: String(Math.min(Math.max(1, pageSize), 50)),
    role,
    emailConfirmed,
    hasPurchases,
    needsReview,
    staleRedirected,
  });
  const sanitizedSearch = sanitizeSearch(search);
  if (sanitizedSearch) params.set("search", sanitizedSearch);

  const response = await fetch(`/api/admin/users?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as AdminUsersResult | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error ? payload.error : "No se pudieron cargar usuarios.",
    );
  }

  return payload as AdminUsersResult;
}

function sanitizeSearch(value?: string) {
  return value
    ?.trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}
