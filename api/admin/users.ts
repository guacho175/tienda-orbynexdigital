import type { User } from "@supabase/supabase-js";

import type { ApiRequest, ApiResponse } from "../../src/server/flow/http.js";
import {
  ApiError,
  assertMethod,
  getQueryParam,
  handleApiError,
  sendJson,
} from "../../src/server/flow/http.js";
import { getSupabaseServerEnv } from "../../src/server/flow/env.js";
import { createSupabaseAdmin } from "../../src/server/flow/supabase.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const FILTER_SCAN_PAGE_SIZE = 100;
const FILTER_SCAN_MAX_USERS = 500;
const STALE_REDIRECTED_MINUTES = 30;
const REVIEW_STATUSES = new Set(["stock_conflict", "requires_manual_review"]);
const TERMINAL_FAILED_STATUSES = new Set(["failed", "cancelled", "expired", "reservation_expired"]);

type UserRole = "admin" | "user";
type BooleanFilter = "all" | "yes" | "no";

interface AdminUsersQuery {
  page: number;
  pageSize: number;
  search: string;
  role: UserRole | "all";
  emailConfirmed: BooleanFilter;
  hasPurchases: BooleanFilter;
  needsReview: BooleanFilter;
  staleRedirected: BooleanFilter;
}

interface OrderSummaryRow {
  id: string;
  commerce_order: string;
  status: string;
  currency: string;
  total: number | string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  paid_at: string | null;
  failed_at: string | null;
  expires_at: string | null;
  user_id: string | null;
}

interface AdminUserRow {
  id: string;
  email: string;
  role: UserRole;
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
    latest: Array<{
      id: string;
      commerceOrder: string;
      status: string;
      total: number;
      currency: string;
      createdAt: string;
      paidAt: string | null;
      staleRedirected: boolean;
      guestMatched: boolean;
    }>;
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, "GET");

    const env = getSupabaseServerEnv();
    const supabase = createSupabaseAdmin(env);
    const token = extractBearerToken(req.headers.authorization);

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const requester = authData.user;

    if (authError || !requester?.id) {
      throw new ApiError(401, "Sesion invalida.");
    }

    await assertAdminRole(supabase, requester.id);

    const query = parseAdminUsersQuery(req);
    const usersResult = await listCandidateUsers(supabase, query);
    const userIds = usersResult.users.map((user) => user.id);
    const emails = usersResult.users.map((user) => normalizeEmail(user.email)).filter(Boolean);
    const [rolesByUserId, orderRows] = await Promise.all([
      fetchRolesByUserId(supabase, userIds),
      fetchOrdersForUsers(supabase, userIds, emails),
    ]);

    const rows = usersResult.users.map((user) =>
      buildAdminUserRow(user, rolesByUserId.get(user.id) ?? "user", orderRows),
    );
    const filteredRows = rows.filter((row) => matchesFilters(row, query));
    const total = usersResult.filteredServerSide
      ? filteredRows.length
      : getListUsersTotal(usersResult);
    const pagedRows = usersResult.filteredServerSide
      ? filteredRows.slice(
          query.page * query.pageSize,
          query.page * query.pageSize + query.pageSize,
        )
      : filteredRows;

    sendJson(res, 200, {
      users: pagedRows,
      total,
      page: query.page,
      pageSize: query.pageSize,
      scannedUsers: usersResult.scannedUsers,
      scanLimit: usersResult.scanLimit,
      staleRedirectedMinutes: STALE_REDIRECTED_MINUTES,
    });
  } catch (error) {
    await handleApiError(res, error, "Could not load admin users");
  }
}

function extractBearerToken(authorizationHeader: string | string[] | undefined) {
  if (!authorizationHeader || Array.isArray(authorizationHeader)) {
    throw new ApiError(401, "Necesitas iniciar sesion.");
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new ApiError(401, "Sesion invalida.");
  }

  return match[1];
}

async function assertAdminRole(supabase: ReturnType<typeof createSupabaseAdmin>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "No se pudo validar el rol administrador.");
  }

  if (data?.role !== "admin") {
    throw new ApiError(403, "No tienes permisos para ver usuarios.");
  }
}

function parseAdminUsersQuery(req: ApiRequest): AdminUsersQuery {
  return {
    page: parsePositiveInteger(getQueryParam(req, "page"), 0),
    pageSize: Math.min(
      Math.max(1, parsePositiveInteger(getQueryParam(req, "pageSize"), DEFAULT_PAGE_SIZE)),
      MAX_PAGE_SIZE,
    ),
    search: sanitizeSearch(getQueryParam(req, "search") ?? ""),
    role: parseRoleFilter(getQueryParam(req, "role")),
    emailConfirmed: parseBooleanFilter(getQueryParam(req, "emailConfirmed")),
    hasPurchases: parseBooleanFilter(getQueryParam(req, "hasPurchases")),
    needsReview: parseBooleanFilter(getQueryParam(req, "needsReview")),
    staleRedirected: parseBooleanFilter(getQueryParam(req, "staleRedirected")),
  };
}

async function listCandidateUsers(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  query: AdminUsersQuery,
) {
  const needsLocalScan =
    Boolean(query.search) ||
    query.role !== "all" ||
    query.emailConfirmed !== "all" ||
    query.hasPurchases !== "all" ||
    query.needsReview !== "all" ||
    query.staleRedirected !== "all";

  if (!needsLocalScan) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: query.page + 1,
      perPage: query.pageSize,
    });

    if (error) {
      throw new ApiError(500, "No se pudieron listar los usuarios.");
    }

    return {
      users: data.users ?? [],
      total: typeof data.total === "number" ? data.total : undefined,
      filteredServerSide: false,
      scannedUsers: data.users?.length ?? 0,
      scanLimit: null,
    };
  }

  const users: User[] = [];
  const maxPages = Math.ceil(FILTER_SCAN_MAX_USERS / FILTER_SCAN_PAGE_SIZE);

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: FILTER_SCAN_PAGE_SIZE,
    });

    if (error) {
      throw new ApiError(500, "No se pudieron listar los usuarios.");
    }

    users.push(...(data.users ?? []));
    if ((data.users?.length ?? 0) < FILTER_SCAN_PAGE_SIZE) break;
  }

  return {
    users,
    total: users.length,
    filteredServerSide: true,
    scannedUsers: users.length,
    scanLimit: FILTER_SCAN_MAX_USERS,
  };
}

function getListUsersTotal(result: Awaited<ReturnType<typeof listCandidateUsers>>) {
  return result.total ?? result.users.length;
}

async function fetchRolesByUserId(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userIds: string[],
) {
  const rolesByUserId = new Map<string, UserRole>();
  if (userIds.length === 0) return rolesByUserId;

  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", userIds);

  if (error) {
    throw new ApiError(500, "No se pudieron cargar los roles.");
  }

  for (const role of data ?? []) {
    rolesByUserId.set(role.user_id, role.role === "admin" ? "admin" : "user");
  }

  return rolesByUserId;
}

async function fetchOrdersForUsers(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userIds: string[],
  emails: string[],
) {
  const rowsById = new Map<string, OrderSummaryRow>();

  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, commerce_order, status, currency, total, customer_name, customer_email, created_at, paid_at, failed_at, expires_at, user_id",
      )
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, "No se pudieron cargar las compras vinculadas.");
    }

    for (const row of data ?? []) rowsById.set(row.id, row as OrderSummaryRow);
  }

  if (emails.length > 0) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, commerce_order, status, currency, total, customer_name, customer_email, created_at, paid_at, failed_at, expires_at, user_id",
      )
      .in("customer_email", emails)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, "No se pudieron cargar compras por correo.");
    }

    for (const row of data ?? []) rowsById.set(row.id, row as OrderSummaryRow);
  }

  return Array.from(rowsById.values());
}

function buildAdminUserRow(user: User, role: UserRole, orderRows: OrderSummaryRow[]): AdminUserRow {
  const userEmail = normalizeEmail(user.email);
  const orders = orderRows
    .filter(
      (order) => order.user_id === user.id || normalizeEmail(order.customer_email) === userEmail,
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const paidOrders = orders.filter((order) => order.status === "paid");
  const latestOrder = orders[0];

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? user.confirmed_at ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at ?? user.confirmed_at),
    displayName: latestOrder?.customer_name ?? null,
    orders: {
      total: orders.length,
      paid: paidOrders.length,
      failed: orders.filter((order) => TERMINAL_FAILED_STATUSES.has(order.status)).length,
      review: orders.filter((order) => REVIEW_STATUSES.has(order.status)).length,
      redirected: orders.filter((order) => order.status === "redirected").length,
      staleRedirected: orders.filter(isStaleRedirectedOrder).length,
      guestMatched: orders.filter(
        (order) => !order.user_id && normalizeEmail(order.customer_email) === userEmail,
      ).length,
      totalPaid: paidOrders.reduce((sum, order) => sum + Number(order.total), 0),
      currency: paidOrders[0]?.currency ?? latestOrder?.currency ?? "CLP",
      lastOrderAt: latestOrder?.created_at ?? null,
      latest: orders.slice(0, 5).map((order) => ({
        id: order.id,
        commerceOrder: order.commerce_order,
        status: order.status,
        total: Number(order.total),
        currency: order.currency,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        staleRedirected: isStaleRedirectedOrder(order),
        guestMatched: !order.user_id && normalizeEmail(order.customer_email) === userEmail,
      })),
    },
  };
}

function matchesFilters(row: AdminUserRow, query: AdminUsersQuery) {
  if (query.search) {
    const haystack = [
      row.email,
      row.displayName,
      row.id,
      ...row.orders.latest.map((order) => order.commerceOrder),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) return false;
  }

  if (query.role !== "all" && row.role !== query.role) return false;
  if (!matchesBooleanFilter(row.emailConfirmed, query.emailConfirmed)) return false;
  if (!matchesBooleanFilter(row.orders.paid > 0, query.hasPurchases)) return false;
  if (!matchesBooleanFilter(row.orders.review > 0, query.needsReview)) return false;
  if (!matchesBooleanFilter(row.orders.staleRedirected > 0, query.staleRedirected)) return false;

  return true;
}

function matchesBooleanFilter(value: boolean, filter: BooleanFilter) {
  return filter === "all" || (filter === "yes" ? value : !value);
}

function isStaleRedirectedOrder(order: OrderSummaryRow) {
  if (order.status !== "redirected" || order.paid_at || order.failed_at) return false;

  const referenceTime = order.expires_at ?? order.created_at;
  return Date.now() - new Date(referenceTime).getTime() > STALE_REDIRECTED_MINUTES * 60_000;
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseRoleFilter(value: string | null): UserRole | "all" {
  return value === "admin" || value === "user" ? value : "all";
}

function parseBooleanFilter(value: string | null): BooleanFilter {
  return value === "yes" || value === "no" ? value : "all";
}

function sanitizeSearch(value: string) {
  return value
    .trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}
