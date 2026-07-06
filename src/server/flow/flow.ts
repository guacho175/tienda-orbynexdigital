import { createHmac } from "node:crypto";
import { ApiError } from "./http";
import type { FlowServerEnv } from "./env";

type FlowParamValue = string | number | boolean | null | undefined;
type FlowParams = Record<string, FlowParamValue>;

export interface FlowCreatePaymentResponse {
  url: string;
  token: string;
  flowOrder?: number;
}

export interface FlowPaymentStatus {
  flowOrder?: number;
  commerceOrder?: string;
  requestDate?: string;
  status?: number | string;
  subject?: string;
  currency?: string;
  amount?: number | string;
  payer?: string;
  optional?: unknown;
  pending_info?: unknown;
  paymentData?: unknown;
  merchantId?: string | null;
  [key: string]: unknown;
}

export type LocalOrderStatus = "redirected" | "paid" | "failed" | "cancelled";

export function signFlowParams(params: FlowParams, secretKey: string): string {
  const normalized = normalizeFlowParams(params);
  const toSign = Object.keys(normalized)
    .sort()
    .map((key) => `${key}${normalized[key]}`)
    .join("");

  return createHmac("sha256", secretKey).update(toSign).digest("hex");
}

export async function createFlowPayment(
  env: FlowServerEnv,
  params: FlowParams,
): Promise<FlowCreatePaymentResponse> {
  const payload = signPayload(
    {
      ...params,
      apiKey: env.flowApiKey,
      urlConfirmation: env.flowConfirmationUrl,
      urlReturn: env.flowReturnUrl,
    },
    env.flowSecretKey,
  );

  return postFlow<FlowCreatePaymentResponse>(
    `${env.flowBaseUrl}/payment/create`,
    payload,
  );
}

export async function getFlowPaymentStatus(
  env: FlowServerEnv,
  token: string,
): Promise<FlowPaymentStatus> {
  const payload = signPayload(
    {
      apiKey: env.flowApiKey,
      token,
    },
    env.flowSecretKey,
  );
  const query = new URLSearchParams(payload);

  return getFlow<FlowPaymentStatus>(
    `${env.flowBaseUrl}/payment/getStatus?${query.toString()}`,
  );
}

export function buildFlowRedirectUrl(response: FlowCreatePaymentResponse): string {
  const url = new URL(response.url);
  url.searchParams.set("token", response.token);
  return url.toString();
}

export function mapFlowStatusToLocal(status: unknown): LocalOrderStatus {
  const numericStatus = Number(status);

  if (numericStatus === 2) return "paid";
  if (numericStatus === 3) return "failed";
  if (numericStatus === 4) return "cancelled";
  return "redirected";
}

function signPayload(
  params: FlowParams,
  secretKey: string,
): Record<string, string> {
  const normalized = normalizeFlowParams(params);
  return {
    ...normalized,
    s: signFlowParams(normalized, secretKey),
  };
}

function normalizeFlowParams(params: FlowParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

async function postFlow<T>(url: string, payload: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(payload),
  });

  return parseFlowResponse<T>(response);
}

async function getFlow<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return parseFlowResponse<T>(response);
}

async function parseFlowResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : `Flow API request failed with status ${response.status}`;
    throw new ApiError(response.status >= 500 ? 502 : response.status, message);
  }

  return body as T;
}
